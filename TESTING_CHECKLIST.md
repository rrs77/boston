# ✅ PURCHASE SYSTEM TESTING CHECKLIST

## 🎯 GOAL
Verify the complete purchase flow works end-to-end, from creating a pack to a user accessing paid activities.

---

## 📋 PRE-REQUISITES

### ✅ Step 0: Run Database Migration
**Time:** 5 minutes  
**Status:** ⬜ Not Started

1. Open the file: `SUPABASE_MIGRATION_INSTRUCTIONS.md`
2. Follow the instructions to run the SQL script in Supabase
3. Verify tables were created:
   - `activity_packs` ✅
   - `user_purchases` ✅
4. Check that "Drama Games Activity Pack" exists in `activity_packs` table

**✅ Success Criteria:** Both tables exist, Drama Pack is seeded

---

## 🧪 TEST SUITE

### ✅ Test 1: Admin Access to Manage Packs
**Time:** 2 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. Log in as admin (`rob.reichstorer@gmail.com`)
2. Click Settings (gear icon in header)
3. Look for tabs at the top

**✅ Expected Result:**
- See tab: "📦 Manage Packs" (between Purchases and Data Management)
- Tab is only visible to admin
- Click on it opens the pack management interface

**❌ If Failed:**
- Check you're logged in as `rob.reichstorer@gmail.com`
- Clear cache and reload
- Check browser console for errors

---

### ✅ Test 2: View Existing Packs
**Time:** 2 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. In Settings → Manage Packs
2. Click on "Activity Packs" tab (should be selected by default)

**✅ Expected Result:**
- See "Drama Games Activity Pack"
- Shows: 🎭 icon, £24.99 price
- Shows: Description, "0 categories linked"
- See buttons: "Edit", Delete icon

**❌ If Failed:**
- Migration wasn't run - go back to Step 0
- Check Supabase logs for RLS policy issues

---

### ✅ Test 3: Edit Existing Pack - Link Categories
**Time:** 3 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. Click "Edit" on Drama Games Activity Pack
2. Modal opens with pack details
3. Scroll down to "Link Categories" section
4. Find "Drama" group
5. Click on 2-3 Drama categories (e.g., "Drama - Warm-ups", "Drama - Games")
6. Selected categories should show ✓ checkmark
7. Click "Save Pack"

**✅ Expected Result:**
- Toast notification: "Pack saved successfully!"
- Modal closes
- Pack now shows "2 categories linked" (or however many you selected)
- Linked categories display as colored tags below the pack

**❌ If Failed:**
- Check network tab for failed API calls
- Check Supabase logs
- Verify RLS policies are set correctly

---

### ✅ Test 4: Create a New Pack
**Time:** 3 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. Click "Create Pack" button (top right)
2. Fill in the form:
   - **Pack ID:** `MUSIC_PACK`
   - **Icon:** 🎵 (copy/paste emoji)
   - **Pack Name:** Music Games Activity Pack
   - **Description:** 50+ music activities for KS1 and KS2
   - **Price:** 19.99
   - **Active:** ✅ Checked
3. Link 2-3 Music categories
4. Click "Save Pack"

**✅ Expected Result:**
- Toast: "Pack saved successfully!"
- Music Pack appears in the list
- Shows 🎵, £19.99, description, linked categories
- Both packs now visible (Drama + Music)

**❌ If Failed:**
- Check Pack ID is unique and uppercase with underscores
- Check price is a valid number
- Check Supabase Table Editor → `activity_packs` for the row

---

### ✅ Test 5: View Purchases Tab
**Time:** 1 minute  
**Status:** ⬜ Not Started

**Steps:**
1. Click on "Purchases" tab (next to Activity Packs)

**✅ Expected Result:**
- See message: "No purchases recorded yet"
- See button: "Record Purchase" (top right)

**❌ If Failed:**
- Check `user_purchases` table exists in Supabase

---

### ✅ Test 6: Record a Test Purchase
**Time:** 3 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. Click "Record Purchase" button
2. Modal opens
3. Fill in the form:
   - **User Email:** Your actual email (the one you use to log in)
   - **Activity Pack:** Select "Drama Games Activity Pack"
   - **Amount:** Should auto-fill to 24.99
   - **PayPal Transaction ID:** TEST12345 (or leave empty)
4. Click "Record Purchase"

**✅ Expected Result:**
- Toast: "Purchase recorded for [your-email]!"
- Modal closes
- Purchase appears in the list
- Shows: 🎭, your email, Drama Games Activity Pack, £24.99, today's date, status "active"

**❌ If Failed:**
- Check email matches your logged-in user
- Check Supabase Table Editor → `user_purchases` for the row
- Check browser console for errors

---

### ✅ Test 7: Verify User Owns Pack
**Time:** 2 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. Close Settings modal
2. Go to Activity Library
3. Open browser console (F12 → Console tab)
4. Look for log message: "📦 User owns these packs: ['DRAMA_PACK']"

**✅ Expected Result:**
- Console shows you own DRAMA_PACK
- No errors in console
- Activity Library loads normally

**❌ If Failed:**
- Check `user_purchases` table has a row with your email
- Check status is 'active'
- Check pack_id matches 'DRAMA_PACK'
- Reload the page

---

### ✅ Test 8: Create an Activity Assigned to Pack
**Time:** 3 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. In Activity Library, click "Create Activity" (+ icon)
2. Fill in basic info:
   - **Activity Name:** Test Drama Activity
   - **Description:** This is a test drama game
   - **Category:** Select a Drama category
   - **Time:** 10 minutes
   - **Year Groups:** Select KS1
3. Scroll down to find **"Required Pack (Optional)"** dropdown
4. Select: "🎭 Drama Games Activity Pack - £24.99"
5. Click "Create Activity"

**✅ Expected Result:**
- Toast: "Activity created successfully!"
- Activity appears in your library
- You can see it because you "own" the Drama Pack

**❌ If Failed:**
- Check you're logged in as admin
- If dropdown doesn't appear, you're not admin
- Check browser console for errors

---

### ✅ Test 9: Test Activity Filtering (Different User)
**Time:** 5 minutes  
**Status:** ⬜ Not Started

**This test requires a second user account or incognito mode**

**Steps:**
1. Log out of your admin account
2. Create a new user account OR open app in incognito window
3. Log in with a different email (NOT `rob.reichstorer@gmail.com`)
4. Go to Activity Library
5. Search for "Test Drama Activity"

**✅ Expected Result:**
- The "Test Drama Activity" does NOT appear
- Other free activities are visible
- Console log shows: "📦 User owns these packs: []" (empty array)

**Then:**
6. Log back in as admin
7. Go to Settings → Manage Packs → Purchases
8. Record a purchase for the test user's email (Drama Pack)
9. Log out, log back in as test user
10. Refresh Activity Library

**✅ Expected Result:**
- Now you CAN see "Test Drama Activity"
- Console shows: "📦 User owns these packs: ['DRAMA_PACK']"
- Activity is fully accessible

**❌ If Failed:**
- Check filtering logic in ActivityLibrary.tsx
- Check user_purchases table has row for test user
- Clear browser cache completely
- Check console for API errors

---

### ✅ Test 10: Pack Management - Delete Test Data
**Time:** 2 minutes  
**Status:** ⬜ Not Started

**Steps:**
1. Log in as admin
2. Go to Activity Library
3. Find "Test Drama Activity"
4. Delete it (click Edit → Delete or use delete button)
5. Go to Settings → Manage Packs → Purchases
6. Note the purchase records (we can't delete them from UI yet)
7. (Optional) Go to Supabase Table Editor and delete test purchase rows

**✅ Expected Result:**
- Test activity is deleted
- Packs remain (Drama + Music)
- Purchase records remain for audit trail

---

## 📊 COMPLETE FLOW TEST

### ✅ Test 11: End-to-End Purchase Simulation
**Time:** 10 minutes  
**Status:** ⬜ Not Started

**Simulate a real customer purchase:**

1. **Setup (Admin):**
   - Verify Drama Pack has categories linked
   - Verify at least 5-10 Drama activities are assigned to Drama Pack
   - Verify Drama Pack is active

2. **Customer Visits (Test User):**
   - Log in as test user
   - Go to Activity Library
   - Notice they can't see Drama activities (if filtered correctly)
   - Go to Settings → Purchases
   - See "Drama Games Activity Pack" with PayPal button
   - *(They would click to pay via PayPal in real life)*

3. **Payment Received (Admin):**
   - Admin receives PayPal notification email
   - Admin logs in
   - Admin goes to Settings → Manage Packs → Purchases
   - Admin clicks "Record Purchase"
   - Admin enters customer email, Drama Pack, £24.99, PayPal transaction ID
   - Admin clicks "Record Purchase"

4. **Customer Gets Access (Test User):**
   - Test user refreshes the page (or logs out/in)
   - Test user goes to Activity Library
   - Test user now sees all Drama activities
   - Test user can drag them to lessons
   - Test user can print lesson plans with Drama activities

**✅ Expected Result:**
- Entire flow works smoothly
- No errors at any stage
- Customer access is granted immediately after purchase recording
- Activities are fully usable in lessons

---

## 🎯 SUCCESS CRITERIA

### All Tests Pass ✅
- ✅ Migration completed
- ✅ Admin can access Manage Packs
- ✅ Can view, edit, create, delete packs
- ✅ Can link categories to packs
- ✅ Can record purchases
- ✅ Can view purchase history
- ✅ Activities filter correctly by ownership
- ✅ Admin can assign activities to packs
- ✅ End-to-end flow works perfectly

### Performance ⚡
- Pages load quickly
- No console errors
- API calls succeed
- Toast notifications work
- UI is responsive

### Security 🔐
- Only admin sees Manage Packs tab
- Only admin sees pack dropdown in Activity Creator
- Non-owners can't see paid activities
- RLS policies protect data

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "Failed to load packs"
**Cause:** Migration not run or RLS policies not set
**Fix:** Run the SQL migration, check Supabase logs

### Issue 2: Can't see "Manage Packs" tab
**Cause:** Not logged in as admin
**Fix:** Ensure logged in as `rob.reichstorer@gmail.com`

### Issue 3: Activities not filtering
**Cause:** User purchases not loading or console errors
**Fix:** Check browser console, verify API calls, check user_purchases table

### Issue 4: Pack categories not saving
**Cause:** Array data type issue in Supabase
**Fix:** Verify `category_ids` column is TEXT[] type in Supabase

### Issue 5: Purchase doesn't appear after recording
**Cause:** Page not refreshing or data not persisting
**Fix:** Manually refresh page, check Supabase table for row, check status is 'active'

---

## 📈 AFTER TESTING

### ✅ Production Checklist
Once all tests pass:

1. **Clean up test data:**
   - Delete test activities
   - Keep test purchases for reference (or delete)
   - Keep both packs (Drama + Music)

2. **Link real categories:**
   - Go through each pack
   - Link all relevant categories
   - Verify category assignments

3. **Prepare real activities:**
   - Assign 50+ Drama activities to Drama Pack
   - Assign 40+ Music activities to Music Pack
   - Leave free activities unassigned

4. **Test with real user:**
   - Have a colleague test the purchase flow
   - Verify they can't see paid activities
   - Record a purchase for them
   - Verify they get instant access

5. **Set up PayPal:**
   - Verify PayPal link in Settings → Purchases works
   - Test payment flow
   - Set up tracking for PayPal notifications

6. **Announce to users:**
   - Send email about new packs available
   - Include pricing and what's included
   - Link to purchase page
   - Offer launch discount? 🎉

---

## 🎉 YOU'RE DONE!

Once all tests pass, you have a **fully functional e-commerce system**!

**Time to celebrate:** 🎊🎉🥳

**Revenue starts:** NOW! 💰

---

## 📞 REPORT ISSUES

If any test fails:

1. **Note which test failed**
2. **Copy the error message from console**
3. **Take a screenshot**
4. **Check Supabase logs**
5. **Let me know** and I'll help debug!

---

**Good luck with testing!** 🚀

You're building something amazing! 🎨

