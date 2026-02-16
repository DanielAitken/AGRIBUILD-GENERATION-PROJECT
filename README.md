# AgriBuild Public Quote Builder

This project now supports:

- Public access to the quote form at `/`
- Form submission to `/quote`
- Automatic PDF generation of form answers
- Email delivery to your inbox with:
  - Generated PDF attached
  - Any uploaded drawings attached

## 1. Install and run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## 2. Configure environment variables

Copy `.env.example` to `.env` and set:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` for 465, otherwise `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `MAIL_TO`
- `PORT`

## 3. Make it public (shareable link)

Deploy to a Node host such as Render/Railway:

1. Push this project to GitHub.
2. Create a new web service from the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the same environment variables from your `.env`.
6. Deploy.

After deploy, you will get a public URL (for example `https://your-app.onrender.com/`) that you can share with customers.

## 4. How submissions work

When a user submits the form:

1. The server receives fields and uploaded drawings.
2. The server creates a PDF summary of the form.
3. The server emails you (`MAIL_TO`) with the PDF + uploaded files.

