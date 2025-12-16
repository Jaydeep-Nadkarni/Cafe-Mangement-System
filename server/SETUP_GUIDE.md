# Cafe Management System - Setup Guide

## Automatic Seeding

The server automatically seeds sample data when it starts:

### Default Credentials

**Admin User:**
- Email: `admin@cafe.com`
- Password: `admin123`
- Role: Admin

**Manager User:**
- Email: `manager@cafe.com`
- Password: `manager123`
- Role: Manager

**Sample Branch:**
- Name: Main Branch
- Branch Code: MAIN
- Manager: manager@cafe.com

## First Time Setup

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Wait for seeding to complete** (takes ~2-3 seconds)
   Look for these messages in the console:
   - "Admin created successfully"
   - "Manager created successfully"
   - "Sample branch created successfully"

3. **Log in to the client:**
   - Open http://localhost:3000 in your browser
   - Use the manager credentials to access the branch dashboard

## For Existing Users

If you already have user accounts created before the seeding was added:

### Option A: Use New Seeded Credentials
- Simply log out and log in with the seeded credentials above

### Option B: Assign Branch to Existing Manager
1. Log in as admin (`admin@cafe.com` / `admin123`)
2. Go to Admin Dashboard
3. Create a new branch or edit the existing one
4. Assign the manager to the branch
5. Log out and log in as the manager

## Troubleshooting

**Error: "No branch assigned to this manager"**
- This means your manager user doesn't have a branch assigned
- Use Option A or B above to resolve

**Database Connection Failed**
- Ensure MongoDB is running and the connection string is correct
- Check `.env` file for `MONGODB_URI`

**Seed script not running**
- Check browser console and server logs
- Ensure server has restarted after code changes
- Manually create admin/manager/branch through API if needed

## Database Reset

To reset the database and start fresh:

```bash
# Delete the database
# Then restart the server
npm start
```

The server will automatically re-seed all data.
