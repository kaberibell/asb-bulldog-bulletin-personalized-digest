# ASB Bulldog Bulletin Personalized Digest

**Created by Kaberi Bell, ASB School Parent**

---

## What Is This?

Every week, our school sends out a newsletter packed with information — events, volunteering opportunities, sports sign-ups, food drives, and much more. The problem is that not everything in that newsletter is relevant to your family. If you have a child in 1st grade, you don't need to read about 8th grade graduation or middle school sports results.

This tool automatically reads your school's weekly newsletter when it arrives in your Gmail inbox, filters it down to only what matters to your family, and sends you a clean, easy-to-read digest email. If there's a food drive, it even adds a reminder to your Google Calendar on the Saturday before the first Monday of the month so you remember to pick up the specific supplies assigned to your child's grade.

---

## Who Is This For?

This is for any school parent who:
- Receives a weekly school newsletter via email
- Uses Gmail and Google Calendar
- Wants a shorter, more relevant version of the newsletter sent directly to them to save time
- Is curious and wants to explore new ways to optimize their life

---

## What You Get

- A filtered digest email every week with:
  - **Action Items** (things you need to do, sorted by deadline, with links)
  - **Upcoming Events** (dates and FYI items relevant to your child's grade)
  - Traffic duty check (flags your family name if you're on the schedule)
- A **Google Calendar reminder** the Saturday before any food drive, with your child's grade's assigned items

---

## How Long Does Setup Take?

**Estimated time: 30–60 minutes** for a first-timer.

Here's a realistic breakdown:
- Getting an Anthropic API key: ~10–15 minutes (new account setup, unfamiliar process)
- Setting up Google Apps Script and pasting the code: ~10 minutes
- Customizing your family details: ~5 minutes
- Authorizing permissions and running a test: ~10–15 minutes
- Troubleshooting (just in case): ~0–15 minutes

The two trickiest parts are getting the API key (it's a new kind of account most people haven't set up before) and the Google authorization step (which shows a scary-looking warning that is safe to proceed through). Both are explained in detail below.

---

## What You Need Before Starting

1. A **Gmail account** (the same one that receives the school newsletter)
2. A **free Anthropic account** to get an API key (this is what powers the AI filtering)
3. About 30–60 minutes without distraction so you can set this up

---

## Step-by-Step Setup

### Step 1: Get Your Anthropic API Key

This is the "key" that lets the script use Claude AI to read and filter the newsletter. Think of it like a password that your script uses to access the AI.

1. Go to **console.anthropic.com**
2. Click **Sign Up** and create a free account
3. Once logged in, click **"API Keys"** in the left sidebar
4. Click **"Create Key"**
5. Give it a name like "School Bulletin"
6. **Copy the key** — it starts with `sk-ant-...`
7. Paste it somewhere safe temporarily (like a notes app) — you'll need it in Step 3

> ⚠️ **Important:** Never share your API key with anyone or paste it into a chat. Treat it like a password. If you end up sharing it with anyone, get a new API key and replace the old one in the code

---

### Step 2: Open Google Apps Script

1. Go to **script.google.com** (make sure you're signed into the Gmail account that receives the newsletter)
2. Click **"New Project"** in the top left
3. You'll see a blank code editor with some default text — select all of it and delete it

---

### Step 3: Paste and Customize the Script

1. Download the file **BulldogBulletin.gs** from this repository
2. Open it in any text editor (Notepad on Windows, TextEdit on Mac)
3. Copy everything
4. Paste it into the Google Apps Script editor

Now find the **CONFIG section** at the top — it looks like this:

```javascript
const CONFIG = {
  SENDER_EMAIL: "advancement@asbschool.org",
  RECIPIENTS: ["PARENT_ONE@gmail.com", "PARENT_TWO@gmail.com"],
  CHILD_GRADE: "YOUR_CHILDS_GRADE",
  FAMILY_NAME: "YOUR_LAST_NAME",
  BULLETIN_NAME: "Bulldog Bulletin Digest",
  SCHOOL_NAME: "ASB SCHOOL",
  SECTIONS_TO_SKIP: "faith/parish content (except food drive), upper-grade spotlights, 8th grade content, admissions referral asks, parish volunteering, athletic results/recaps",
  ANTHROPIC_API_KEY: "PASTE_YOUR_ANTHROPIC_API_KEY_HERE",
  LABEL_NAME: "BulletinProcessed"
};
```

Replace each placeholder with your own information:

| Placeholder | What to put here | Example |
|---|---|---|
| `YOUR_SCHOOL_BULLETIN_EMAIL@school.org` | The email address the newsletter comes from | `newsletter@lincolnelementary.org` |
| `PARENT_ONE@gmail.com` | Your email address | `jane.smith@gmail.com` |
| `PARENT_TWO@gmail.com` | Your partner's email (or delete this entry if just one recipient) | `john.smith@gmail.com` |
| `YOUR_CHILDS_GRADE` | Your child's grade | `2nd Grade` |
| `YOUR_LAST_NAME` | Your family's last name | `Smith` |
| `YOUR BULLETIN NAME` | The name of the newsletter | `Lincoln Lions Newsletter` |
| `YOUR SCHOOL NAME` | Your school's name | `Lincoln Elementary` |
| `PASTE_YOUR_ANTHROPIC_API_KEY_HERE` | The API key you copied in Step 1 | `sk-ant-api03-...` |

> **Tip:** Be careful when editing — each line must end with a comma except the last one before the closing `}`. Don't add or remove any quotes or commas accidentally.

Once you've filled everything in, click the **Save icon** (or press Ctrl+S on Windows / Cmd+S on Mac). Name the project something like "School Bulletin Digest".

---

### Step 4: Authorize the Script

1. In the toolbar at the top, make sure the dropdown shows **`checkForBulletin`**
2. Click the **▶ Run** button
3. Google will ask you to authorize the script — click **"Review Permissions"**
4. Choose your Gmail account
5. You will see a warning: **"Google hasn't verified this app"** — this is normal and safe. You are the developer of this script, and it only accesses your own account
6. Click **"Advanced"** in the bottom left of that warning
7. Click **"Go to [your project name] (unsafe)"**
8. Click **"Allow"**

---

### Step 5: Check the Logs

After the script runs, click **View → Logs** to see what happened. You're looking for:

```
Processing email: "Newsletter - October 4, 2026"
Digest sent to jane.smith@gmail.com
Digest sent to john.smith@gmail.com
Done processing: "Newsletter - October 4, 2026"
```

If you see those lines, check your inbox — the digest email should be there!

If you see an error, see the **Troubleshooting** section below.

---

### Step 6: Set Up the Automatic Weekly Schedule

This makes the script run automatically every week so you never have to think about it.

1. In Google Apps Script, click the **clock icon** in the left sidebar (called "Triggers")
2. Click **"+ Add Trigger"** in the bottom right
3. Set it up like this:
   - **Function to run**: `checkForBulletin`
   - **Event source**: `Time-driven`
   - **Type of time based trigger**: `Week timer`
   - **Day of week**: `Every Friday`
   - **Time of day**: `10am to 11am`
4. Click **Save**

That's it! Every Friday morning the script will wake up, check if a new bulletin arrived that week, and send your digest if one is found.

---

## Customizing What Gets Filtered

The filtering is controlled by the `SECTIONS_TO_SKIP` setting and the instructions inside the script. Here's how to adjust them for your family:

### If you want to skip different sections

Find the `SECTIONS_TO_SKIP` line in the CONFIG and edit it. For example:

```javascript
SECTIONS_TO_SKIP: "upper-grade content, sports results, fundraising asks",
```

### If you have kids in multiple grades

Find this line in the `processWithClaude` function:

```javascript
"- Child's grade: " + CONFIG.CHILD_GRADE + "\n" +
```

You can change it to list multiple grades:

```javascript
"- Children's grades: 1st Grade and 4th Grade\n" +
```

And update the food drive line to check for both grades:

```javascript
"3. INCLUDE: ... food drive items for 1st Grade AND 4th Grade ...\n" +
```

### If your school doesn't have a food drive

Find and delete these lines from the prompt:

```javascript
"6. If a food drive is found, add these two lines at the very end:\n" +
"   FOOD_DRIVE_DATE: YYYY-MM-DD\n" +
"   FOOD_DRIVE_ITEMS: item1, item2\n\n" +
```

### If you want to add sections to always include

Find the `INCLUDE:` line in the prompt and add your preferences:

```javascript
"3. INCLUDE: school-wide deadlines, volunteer sign-ups, YOUR ADDITIONS HERE ...\n" +
```

---

## Troubleshooting

**"No new bulletin emails found" in the logs but a bulletin arrived**
- Check that `SENDER_EMAIL` exactly matches the address the newsletter comes from (check the "From" field in Gmail)
- Make sure the newsletter arrived within the past 7 days

**"Claude API error" in the logs**
- Double-check your API key is pasted correctly with no extra spaces
- Make sure it starts with `sk-ant-`
- Visit console.anthropic.com to confirm the key is active

**Syntax error when saving**
- This usually means a missing comma or quote in the CONFIG section
- Go through each line carefully and make sure every line except the last one ends with a comma
- Make sure all text values are wrapped in double quotes `"`

**The digest email arrived but content looks wrong**
- Adjust the `SECTIONS_TO_SKIP` and `CHILD_GRADE` values in CONFIG
- The AI does its best but may need tuning for your specific school's newsletter format

**Got the "Google hasn't verified this app" warning**
- This is normal — follow Step 4 above to proceed safely

---

## Privacy Note

This script runs entirely within your own Google account. It reads your Gmail and Google Calendar — no data is sent anywhere except to the Anthropic API (which processes the newsletter text to generate the digest) and back to your own Gmail. Your emails are not stored or shared.

