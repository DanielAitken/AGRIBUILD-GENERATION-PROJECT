const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const path = require("path");

require("dotenv").config();

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
});

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.use(express.static(path.join(__dirname)));

function formatField(label, value) {
  if (!value) return `${label}:`;
  return `${label}: ${value}`;
}

function valueOrDefault(value) {
  return value && String(value).trim() ? String(value).trim() : "Not provided";
}

function buildQuotePdf(body, files) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const submittedAt = new Date().toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.fontSize(21).text("AgriBuild Quote Request");
    doc.moveDown(0.25);
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(`Submitted: ${submittedAt}`)
      .fillColor("#111111");
    doc.moveDown(1);

    const sections = [
      {
        title: "Project Details",
        fields: [
          ["Package required", "supply_option"],
          ["Division", "division"],
          ["Proposed use", "proposed_use"],
          ["Building type", "building_type"],
          ["Units", "units"],
          ["Length", "length"],
          ["Width", "width"],
          ["Height", "height"],
          ["Project notes", "project_notes"],
        ],
      },
      {
        title: "Specification",
        fields: [
          ["Steelwork finish", "steelwork_finish"],
          ["Roof material", "roof_material"],
          ["Wall material", "wall_material"],
          ["Heated", "heated"],
          ["Cladding preference", "cladding"],
          ["Door types", "door_types"],
          ["Door details", "door_details"],
          ["Internal fittings", "internal_fittings"],
        ],
      },
      {
        title: "Site & Delivery",
        fields: [
          ["Site postcode", "site_postcode"],
          ["Site address", "site_address"],
          ["Site setting", "site_setting"],
          ["Planning status", "planning_status"],
          ["Timescales", "timescales"],
          ["Groundworks", "groundworks"],
          ["Other info", "other_info"],
        ],
      },
      {
        title: "Contact Details",
        fields: [
          ["First name", "first_name"],
          ["Surname", "last_name"],
          ["Email", "email"],
          ["Telephone", "telephone"],
          ["Return date", "return_date"],
          ["Correspondence address", "contact_address"],
          ["Heard about us", "hear_about"],
          ["Marketing consent", "marketing"],
        ],
      },
    ];

    sections.forEach((section) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor("#1b2f6b")
        .text(section.title);
      doc.moveDown(0.35);

      section.fields.forEach(([label, key]) => {
        const value = valueOrDefault(body[key]);
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#111111")
          .text(`${label}: `, { continued: true })
          .font("Helvetica")
          .text(value);
      });

      doc.moveDown(0.9);
    });

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#1b2f6b")
      .text("Uploaded Drawings");
    doc.moveDown(0.35);

    if (!files || files.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#111111")
        .text("No files uploaded.");
    } else {
      files.forEach((file, index) => {
        doc
          .font("Helvetica")
          .fontSize(10)
          .fillColor("#111111")
          .text(`${index + 1}. ${file.originalname}`);
      });
    }

    doc.end();
  });
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "agri.html"));
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/quote", (_req, res) => {
  res.redirect(303, "/");
});

app.post("/quote", upload.array("drawings"), async (req, res) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_TO) {
      throw new Error(
        "Missing required mail settings: SMTP_USER, SMTP_PASS, and MAIL_TO."
      );
    }

    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure =
      process.env.SMTP_SECURE === "true" || smtpPort === 465;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.office365.com",
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { ciphers: "TLSv1.2" },
    });

    const body = req.body || {};
    const lines = [
      "New AgriBuild quote request",
      "--------------------------------",
      "",
      formatField("Package required", body.supply_option),
      formatField("Division", body.division),
      formatField("Proposed use", body.proposed_use),
      formatField("Building type", body.building_type),
      formatField("Units", body.units),
      formatField("Length", body.length),
      formatField("Width", body.width),
      formatField("Height", body.height),
      formatField("Project notes", body.project_notes),
      "",
      formatField("Steelwork finish", body.steelwork_finish),
      formatField("Roof material", body.roof_material),
      formatField("Wall material", body.wall_material),
      formatField("Heated", body.heated),
      formatField("Cladding preference", body.cladding),
      formatField("Door types", body.door_types),
      formatField("Door details", body.door_details),
      formatField("Internal fittings", body.internal_fittings),
      "",
      formatField("Site postcode", body.site_postcode),
      formatField("Site address", body.site_address),
      formatField("Site setting", body.site_setting),
      formatField("Planning status", body.planning_status),
      formatField("Timescales", body.timescales),
      formatField("Groundworks", body.groundworks),
      formatField("Other info", body.other_info),
      "",
      formatField("First name", body.first_name),
      formatField("Surname", body.last_name),
      formatField("Email", body.email),
      formatField("Telephone", body.telephone),
      formatField("Return date", body.return_date),
      formatField("Correspondence address", body.contact_address),
      formatField("Heard about us", body.hear_about),
      formatField("Marketing consent", body.marketing),
    ];

    const pdfBuffer = await buildQuotePdf(body, req.files || []);
    const pdfFilename = `quote-request-${Date.now()}.pdf`;

    const attachments = (req.files || []).map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    }));
    attachments.unshift({
      filename: pdfFilename,
      content: pdfBuffer,
      contentType: "application/pdf",
    });

    const subjectPieces = [body.first_name, body.last_name].filter(Boolean);
    const subject =
      subjectPieces.length > 0
        ? `New quote request: ${subjectPieces.join(" ")}`
        : "New quote request";

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.MAIL_TO,
      subject,
      text: lines.join("\n"),
      replyTo: body.email || undefined,
      attachments,
    });

    res
      .status(200)
      .send("Thanks! Your quote request has been sent.");
  } catch (err) {
    console.error("Email send failed:", err);
    res
      .status(500)
      .send("Sorry, something went wrong sending your request.");
  }
});

app.use((_req, res) => {
  res.status(404).send("Not Found. Please open / and submit the form.");
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
