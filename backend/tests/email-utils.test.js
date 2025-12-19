import test from "ava";
import sgMail from "@sendgrid/mail";

// Prepare env for building template URLs
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://client.example";
process.env.SENDGRID_EMAIL = process.env.SENDGRID_EMAIL || "noreply@example.com";
process.env.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "SG.fake-key";

// Stub sendgrid methods to avoid network calls
sgMail.setApiKey = () => {};
sgMail.send = async (msg) => ({ ok: true, msg });

// Load module after stubbing so top-level setApiKey uses the stub
const { default: email } = await import("../src/utils/email.js");

test("sendEmail builds payload correctly", async (t) => {
	const data = { x: 1 };
	const to = "user@example.com";
	const templateId = "template-123";
	const res = await email.sendEmail(data, to, templateId);
	t.true(res.ok);
	t.is(res.msg.to, to);
	t.is(res.msg.templateId, templateId);
	t.deepEqual(res.msg.dynamicTemplateData, data);
});

test("forgotPassword builds reset URL", async (t) => {
	const to = "user2@example.com";
	const token = "reset-token";
	const res = await email.forgotPassword(to, token);
	t.true(res.ok);
	t.is(res.msg.to, to);
	t.regex(res.msg.dynamicTemplateData.ResetPasswordUrl, /reset-password\?token=reset-token$/);
});

test("inviteUser builds invitation URL", async (t) => {
	const to = "user3@example.com";
	const token = "invite-token";
	const res = await email.inviteUser(to, token);
	t.true(res.ok);
	t.is(res.msg.to, to);
	t.regex(res.msg.dynamicTemplateData.InvitationUrl, /register\?token=invite-token&email=user3@example.com$/);
});
