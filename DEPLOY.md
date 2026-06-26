# Deploy to your VPS (87.106.200.69)

The app runs on Node + Next.js and talks to **MariaDB on the same VPS** via `127.0.0.1`. No firewall changes needed.

## 1. One-time setup on the VPS

SSH in:

```bash
ssh root@87.106.200.69
```

Install Node.js 20 (skip if already installed):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo npm install -g pm2
```

Verify:

```bash
node -v   # v20.x
npm -v
pm2 -v
```

## 2. Clone the repo

Replace `<YOUR_REPO_URL>` with your GitHub URL (e.g. `https://github.com/yourname/lallubhai-amichand.git`).

```bash
cd /var/www
sudo git clone <YOUR_REPO_URL> lallubhai-amichand
sudo chown -R $USER:$USER lallubhai-amichand
cd lallubhai-amichand
```

## 3. Configure environment

```bash
nano .env.local
```

Set (use the full connection URL — this is required for the app to connect to the database):

```
NEXTAUTH_SECRET=<your-secret-from-env.local>
DEVELOPER_SECRET=<your-developer-secret>
POSTGRES_URL=postgresql://<db_user>:<db_password>@127.0.0.1:5433/<db_name>
```

> Note: Use `127.0.0.1` (not the public IP `87.106.200.69`) to connect to the local DB on the same VPS.

## 4. Install + build + migrate

```bash
npm ci
```

The app auto-creates the database schema and seeds users on first startup (no separate migration step needed).

## 5. Run with PM2

```bash
pm2 start server.js --name lallubhai-amichand --cwd /var/www/lallubhai-amichand
pm2 save
pm2 startup       # follow the command it prints to enable on boot
```

The app now runs on `http://127.0.0.1:3000` on the VPS.

## 6. Expose via Nginx (recommended)

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/lallubhai-amichand
```

Paste:

```nginx
server {
  listen 80;
  server_name erp.example.com;   # or use the bare IP

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Enable + reload:

```bash
sudo ln -s /etc/nginx/sites-available/lallubhai-amichand /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Open in browser: `http://87.106.200.69` (or your domain).

## 7. Future updates

After pushing changes to GitHub:

```bash
cd /var/www/lallubhai-amichand
git pull
npm ci
npm run build
pm2 restart lallubhai-amichand
```

## Useful commands

```bash
pm2 logs lallubhai-amichand       # live logs
pm2 status                       # process state
pm2 restart lallubhai-amichand    # restart
pm2 stop lallubhai-amichand       # stop
```
