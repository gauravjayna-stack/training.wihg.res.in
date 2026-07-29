# ACCOUNTS_MANUAL.md
## Step-by-Step Guide for the Accounts / Finance Team

This guide covers verifying fee payments, handling EWS fee waivers, confirming physical joining, and running financial audits/exports.

---

## 1. Logging in

Your account is created by the Admin/Training Cell. Log in at the portal URL with the email and temporary password provided, and request a password change if you haven't been given a way to set your own.

---

## 2. Verifying fee payments

Go to **Accounts Dashboard → Pending Fee Verifications**. Each entry shows:

- Student name
- UTR / transaction number they entered
- Amount claimed
- A link to **View receipt** (the uploaded payment proof)

### To verify a payment:
1. Open the receipt and cross-check the UTR number, amount, and date against your bank statement/merchant portal.
2. If everything matches, click **Verify**. This automatically:
   - Marks the payment as verified in the system
   - Moves the student to "Approved for Joining" status
   - Emails the student confirming they can now submit their physical Joining Form
3. If something doesn't match (wrong amount, unrecognized UTR, unclear receipt), click **Reject**. The student's status reverts to "Fee Payment Needed" so they can resubmit correct details. There is currently no automatic email on rejection — follow up with the student directly if the issue isn't obvious from context.

**Never verify a payment you haven't personally cross-checked against the bank record.**

---

## 3. EWS Fee Waivers

Fee waivers are granted by the **Admin/Training Cell**, not by Accounts directly — this is a Director-level approval. Once a waiver is granted for a student's application:

- Their `Fee Waived` flag will show as **Yes** on the Admin dashboard's application list.
- The waiver reason/note (e.g. "EWS category — Director approved") is recorded against the application.
- The student skips the fee-payment step entirely and proceeds straight to joining.

If a student claims they were told they have a waiver but you don't see it reflected, do **not** verify a fee payment on their behalf as a workaround — confirm with the Admin/Training Cell that the waiver was actually recorded first.

---

## 4. Physical joining verification

After a student submits their **Joining Form** (Day 1, in person), their record appears under **Accounts Dashboard → Physical Joining Verification**.

1. Confirm the student has physically reported, and that their submitted ID proof and fee receipt copy match what's on file.
2. Click **Mark Verified**. This moves them to "In Progress" — their tenure has officially started.

---

## 5. Running financial audits / exports

From the **Admin Dashboard**, use **Export CSV** to download a spreadsheet of all applications, including:

- Student name, email, programme type, college
- Assigned scientist
- Current status
- Fee payment status and whether the fee was waived
- Start/end dates

You can filter the export by year, discipline, supervisor, or fee status by adding query parameters to the export link (ask the Training Cell/Admin if you need a specific filtered report — they control the filter options on the dashboard).

---

## 6. Frequently asked questions

**A student paid but I can't find their entry.**
They may not have submitted the payment form yet, or their application may still be pending Admin/Scientist approval — payment upload is only possible after approval. Check their status on the Admin dashboard.

**Can I reverse a verification after clicking it by mistake?**
Not directly from your dashboard — contact the Admin/Training Cell, who can adjust the record.

**What file types can students upload as receipts?**
PDF, JPG, PNG, or WEBP, up to 8MB.
