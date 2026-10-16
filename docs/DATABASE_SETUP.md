# MySQL Database Setup Guide for Windows

This guide provides step-by-step PowerShell instructions to configure MySQL for the **Level-Based Community Coding Practice Platform (`prac_web`)**.

---

## 1. Verify MySQL Server Status

Check if your local MySQL Windows service is running:

```powershell
Get-Service -Name *mysql*
```

If the service is stopped, start it:
```powershell
Start-Service -Name MySQL80
```

---

## 2. Create the Database & Dedicated User

Open PowerShell and log in to MySQL using the MySQL CLI client:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```
*(Enter your MySQL root password when prompted)*

Run the following SQL commands to create the dedicated database and application user:

```sql
-- 1. Create database
CREATE DATABASE IF NOT EXISTS `prac_web` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Create dedicated user (replace 'your_secure_password' with your desired password)
CREATE USER IF NOT EXISTS 'prac_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- 3. Grant necessary permissions on prac_web database
GRANT ALL PRIVILEGES ON `prac_web`.* TO 'prac_user'@'localhost';
FLUSH PRIVILEGES;

-- 4. Exit MySQL prompt
EXIT;
```

---

## 3. Configure Server Environment (`server/.env`)

Edit `server/.env` in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=prac_user
DB_PASSWORD=your_secure_password
DB_NAME=prac_web
```

---

## 4. Run Migrations and Seed Data

Run the migration script to create all 12 tables and relational constraints:

```powershell
npm --prefix server run db:migrate
```

Then seed the 4 programming curricula (C, C++, Java, Python), 24 levels, and starter questions:

```powershell
npm --prefix server run db:seed
```

---

## 5. Bootstrap the First Administrator

Initialize your platform administrator account:

```powershell
npm --prefix server run admin:bootstrap
```

By default, this sets up the admin credentials configured in `server/.env`:
- **Username:** `admin`
- **Email:** `admin@pracweb.dev`
- **Password:** `Admin@PracWeb2026!`

*(You can customize these variables in `server/.env` before running the command).*
