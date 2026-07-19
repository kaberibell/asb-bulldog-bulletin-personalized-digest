// ============================================================
// BULLDOG BULLETIN PROCESSOR
// Automatically reads your school's weekly newsletter and
// sends a filtered digest to your family.
//
// Setup instructions: see README.md
// ============================================================

// ---------- CONFIGURATION ----------
// *** CHANGE THESE VALUES TO YOUR OWN FAMILY'S INFO ***
const CONFIG = {
  SENDER_EMAIL: "YOUR_SCHOOL_BULLETIN_EMAIL@school.org",  // The email address the bulletin comes from
  RECIPIENTS: ["PARENT_ONE@gmail.com", "PARENT_TWO@gmail.com"],  // Who gets the digest
  CHILD_GRADE: "YOUR_CHILDS_GRADE",  // e.g. "1st Grade", "3rd Grade", "Kindergarten"
  FAMILY_NAME: "YOUR_LAST_NAME",  // Used to check traffic duty schedule
  BULLETIN_NAME: "YOUR BULLETIN NAME",  // e.g. "Bulldog Bulletin" — used to identify the newsletter
  SCHOOL_NAME: "YOUR SCHOOL NAME",  // e.g. "ASB School"
  SECTIONS_TO_SKIP: "faith/parish content (except food drive), upper-grade spotlights, 8th grade content, admissions referral asks, parish volunteering, athletic results/recaps",  // What to filter out
  ANTHROPIC_API_KEY: "PASTE_YOUR_ANTHROPIC_API_KEY_HERE",  // Get this from console.anthropic.com
  LABEL_NAME: "BulletinProcessed"  // Gmail label to avoid reprocessing — you can leave this as is
};
// *** END OF CONFIGURATION ***

// ---------- MAIN FUNCTION (runs on schedule) ----------
function checkForBulletin() {
  const label = getOrCreateLabel(CONFIG.LABEL_NAME);
  var oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  var dateStr = Utilities.formatDate(oneWeekAgo, Session.getScriptTimeZone(), "yyyy/MM/dd");
  const query = "from:" + CONFIG.SENDER_EMAIL + " -label:" + CONFIG.LABEL_NAME + " after:" + dateStr;
  const threads = GmailApp.search(query);

  if (threads.length === 0) {
    Logger.log("No new bulletin emails found.");
    return;
  }

  for (var i = 0; i < threads.length; i++) {
    var thread = threads[i];
    var message = thread.getMessages()[0];
    var subject = message.getSubject();
    var body = message.getPlainBody();
    var date = message.getDate();

    Logger.log("Processing email: " + subject);

    if (!isBulletin(subject, body)) {
      Logger.log("Skipping - not a bulletin: " + subject);
      thread.addLabel(label);
      continue;
    }

    var result = processWithClaude(subject, body, date);

    if (result) {
      sendDigestEmail(result.digest, date);
      if (result.foodDrive) {
        createFoodDriveReminder(result.foodDrive);
      }
    }

    thread.addLabel(label);
    Logger.log("Done processing: " + subject);
  }
}

// ---------- GATE CHECK ----------
function isBulletin(subject, body) {
  if (subject.toLowerCase().indexOf(CONFIG.BULLETIN_NAME.toLowerCase()) !== -1) return true;
  var sections = ["Calendar", "Announcements", "Weekly Feature", "Parent Board", "Volunteering", "Athletics", "Student Life"];
  var found = 0;
  for (var i = 0; i < sections.length; i++) {
    if (body.indexOf(sections[i]) !== -1) found++;
  }
  return found >= 3;
}

// ---------- CALL CLAUDE ----------
function processWithClaude(subject, body, date) {
  var prompt = "You are processing the " + CONFIG.SCHOOL_NAME + " newsletter for the " + CONFIG.FAMILY_NAME + " family.\n\n" +
    "FAMILY PROFILE:\n" +
    "- Child's grade: " + CONFIG.CHILD_GRADE + "\n" +
    "- Family name: " + CONFIG.FAMILY_NAME + "\n" +
    "- Interests: volunteering sign-ups, upcoming school events, " + CONFIG.CHILD_GRADE + " relevant news, sports registrations open to all students, food drive grade assignments, traffic duty schedule (check for " + CONFIG.FAMILY_NAME + ")\n\n" +
    "INSTRUCTIONS:\n" +
    "1. Filter the bulletin for what is relevant to this family.\n" +
    "2. SKIP: " + CONFIG.SECTIONS_TO_SKIP + "\n" +
    "3. INCLUDE: school-wide deadlines, volunteer sign-ups, " + CONFIG.CHILD_GRADE + " relevant events, sports registrations with sport name/cost/deadline/link, Extended Care, school store deadlines, food drive " + CONFIG.CHILD_GRADE + " items, traffic duty only if " + CONFIG.FAMILY_NAME + " appears.\n" +
    "4. ALWAYS include sign-up links or contact emails for every action item.\n" +
    "5. Format as plain text:\n" +
    "   - Start action items section with: === Action Items ===\n" +
    "   - Start events section with: === Upcoming Events ===\n" +
    "   - Use a dash and space to start each bullet point\n" +
    "   - Write deadlines in caps like DUE: Oct 10\n" +
    "6. If a food drive is found, add these two lines at the very end:\n" +
    "   FOOD_DRIVE_DATE: YYYY-MM-DD\n" +
    "   FOOD_DRIVE_ITEMS: item1, item2\n\n" +
    "BULLETIN DATE: " + date.toDateString() + "\n" +
    "BULLETIN SUBJECT: " + subject + "\n\n" +
    "BULLETIN CONTENT:\n" + body + "\n\n" +
    "Respond with plain text only. No JSON. No markdown. No backticks. " +
    "Only use dates, numbers, and links that appear verbatim in the bulletin content above. " +
    "Do not infer, estimate, or reformat any dates or prices — copy them exactly as written.";

  var payload = {
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": CONFIG.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
  var data = JSON.parse(response.getContentText());

  if (!data.content || !data.content[0]) {
    Logger.log("Claude API error: " + response.getContentText());
    return null;
  }

  var text = data.content[0].text.trim();
  Logger.log("Claude response received, length: " + text.length);

  var foodDrive = null;
  var dateMatch = text.match(/FOOD_DRIVE_DATE:\s*(\d{4}-\d{2}-\d{2})/);
  var itemsMatch = text.match(/FOOD_DRIVE_ITEMS:\s*(.+)/);
  if (dateMatch && itemsMatch) {
    foodDrive = { date: dateMatch[1], items: itemsMatch[1].trim() };
    Logger.log("Food drive found: " + foodDrive.date + " - " + foodDrive.items);
  }

  var digest = text.replace(/FOOD_DRIVE_DATE:.*$/m, "").replace(/FOOD_DRIVE_ITEMS:.*$/m, "").trim();

  return { digest: digest, foodDrive: foodDrive };
}

// ---------- SEND DIGEST EMAIL ----------
function sendDigestEmail(digest, bulletinDate) {
  if (!digest) {
    Logger.log("No digest to send.");
    return;
  }

  var dateStr = Utilities.formatDate(bulletinDate, Session.getScriptTimeZone(), "MMMM d, yyyy");
  var subject = CONFIG.BULLETIN_NAME + " Digest - " + dateStr;

  var lines = digest.split("\n");
  var html = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">';
  html += '<div style="background-color: #1a3a5c; padding: 16px 24px; border-radius: 8px 8px 0 0;">';
  html += '<h2 style="color: white; margin: 0;">' + CONFIG.BULLETIN_NAME + ' Digest</h2>';
  html += '<p style="color: #cce0f5; margin: 4px 0 0 0;">' + dateStr + '</p>';
  html += '</div>';
  html += '<div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">';
  html += '<p>Hi ' + CONFIG.FAMILY_NAME + ' family,</p>';
  html += '<p>Here is your filtered summary of this week\'s ' + CONFIG.BULLETIN_NAME + '.</p>';
  html += '<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">';

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line === "") continue;
    if (line.indexOf("===") === 0) {
      html += '<h3 style="color: #1a3a5c; border-bottom: 2px solid #1a3a5c; padding-bottom: 4px;">' + line.replace(/===/g, "").trim() + '</h3>';
    } else if (line.indexOf("- ") === 0) {
      var content = line.substring(2);
      content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2">$1</a>');
      html += '<p style="margin: 8px 0 8px 16px;">&bull; ' + content + '</p>';
    } else {
      html += '<p style="margin: 8px 0;">' + line + '</p>';
    }
  }

  html += '<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">';
  html += '<p style="color: #888; font-size: 12px;">This digest was auto-generated from your school bulletin. For the full newsletter, check your inbox from ' + CONFIG.SENDER_EMAIL + '.</p>';
  html += '</div></div>';

  for (var j = 0; j < CONFIG.RECIPIENTS.length; j++) {
    GmailApp.sendEmail(CONFIG.RECIPIENTS[j], subject, digest, { htmlBody: html });
    Logger.log("Digest sent to " + CONFIG.RECIPIENTS[j]);
  }
}

// ---------- CREATE FOOD DRIVE CALENDAR REMINDER ----------
function createFoodDriveReminder(foodDrive) {
  if (!foodDrive || !foodDrive.date || !foodDrive.items) return;

  var foodDriveDate = new Date(foodDrive.date + "T12:00:00");
  var saturday = new Date(foodDriveDate);
  saturday.setDate(foodDriveDate.getDate() - 2);

  var startTime = new Date(saturday);
  startTime.setHours(10, 0, 0, 0);
  var endTime = new Date(saturday);
  endTime.setHours(10, 30, 0, 0);

  var title = "Food Drive Reminder - " + CONFIG.CHILD_GRADE + " items";
  var description = "School Food Drive is Monday " + foodDriveDate.toDateString() + "!\n\n" +
    CONFIG.CHILD_GRADE + " is bringing: " + foodDrive.items + "\n\n" +
    "Pick these up at the store today so you are ready for Monday drop-off.";

  CalendarApp.getDefaultCalendar().createEvent(title, startTime, endTime, {
    description: description
  });

  Logger.log("Food drive reminder created for " + saturday.toDateString() + " at 10am");
}

// ---------- HELPER: GET OR CREATE GMAIL LABEL ----------
function getOrCreateLabel(name) {
  var label = GmailApp.getUserLabelByName(name);
  if (!label) {
    label = GmailApp.createLabel(name);
    Logger.log("Created Gmail label: " + name);
  }
  return label;
}
