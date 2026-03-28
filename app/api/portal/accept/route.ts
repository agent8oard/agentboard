import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend } from "@/lib/resend";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, clientName, clientEmail } = body as {
      token: string;
      clientName: string;
      clientEmail: string;
    };

    if (!token || !clientName || !clientEmail) {
      return NextResponse.json({ error: "token, clientName and clientEmail are required" }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data: portal, error } = await supabase
      .from("client_portals")
      .select("*")
      .eq("token", token)
      .single();

    if (error || !portal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (portal.status === "accepted") {
      return NextResponse.json({ error: "Already accepted" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Update portal to accepted
    const { error: updateError } = await supabase
      .from("client_portals")
      .update({
        status: "accepted",
        accepted_at: now,
        client_name: clientName,
        client_email: clientEmail,
        updated_at: now,
      })
      .eq("id", portal.id);

    if (updateError) {
      console.error("Portal accept update error:", updateError);
      return NextResponse.json({ error: "Failed to accept" }, { status: 500 });
    }

    // Update scope_projects status to accepted
    await supabase
      .from("scope_projects")
      .update({ status: "accepted" })
      .eq("id", portal.project_id);

    // Get project title and freelancer info for email
    const [{ data: project }, { data: profile }] = await Promise.all([
      supabase.from("scope_projects").select("title").eq("id", portal.project_id).single(),
      supabase.from("profiles").select("full_name, business_name").eq("id", portal.user_id).single(),
    ]);

    // Get freelancer email
    let freelancerEmail: string | null = null;
    try {
      const { data: authData } = await supabase.auth.admin.getUserById(portal.user_id);
      freelancerEmail = authData?.user?.email ?? null;
    } catch { /* ignore */ }

    const projectTitle = project?.title || "Your project";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const projectUrl = `${appUrl}/scope/${portal.project_id}/proposal`;
    const acceptedDate = new Date(now).toLocaleString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send notification email to freelancer
    if (freelancerEmail && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Scope <noreply@scopeapp.io>",
          to: freelancerEmail,
          subject: `✅ ${clientName} has accepted your proposal for ${projectTitle}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border:1px solid #e5e5e5;">
    <div style="padding:32px 40px;border-bottom:1px solid #f0f0f0;">
      <p style="margin:0;font-size:13px;color:#999;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">Scope</p>
    </div>
    <div style="padding:40px 40px 32px;">
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#111;letter-spacing:-0.03em;">Proposal accepted ✅</h1>
      <p style="margin:0 0 32px;font-size:15px;color:#666;line-height:1.6;">
        Great news — <strong style="color:#111;">${clientName}</strong> has accepted your proposal for <strong style="color:#111;">${projectTitle}</strong>.
      </p>

      <div style="background:#f8f8f8;border:1px solid #e8e8e8;padding:24px;margin-bottom:32px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#888;font-weight:600;width:40%;">Project</td>
            <td style="padding:8px 0;font-size:13px;color:#111;font-weight:600;">${projectTitle}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#888;font-weight:600;">Client name</td>
            <td style="padding:8px 0;font-size:13px;color:#111;">${clientName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#888;font-weight:600;">Client email</td>
            <td style="padding:8px 0;font-size:13px;color:#111;">${clientEmail}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#888;font-weight:600;">Accepted at</td>
            <td style="padding:8px 0;font-size:13px;color:#111;">${acceptedDate}</td>
          </tr>
        </table>
      </div>

      <a href="${projectUrl}" style="display:block;background:#16a34a;color:#ffffff;text-align:center;padding:16px 24px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:0.01em;">
        Log in to view your project →
      </a>
    </div>
    <div style="padding:24px 40px;border-top:1px solid #f0f0f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#bbb;">Powered by Scope</p>
    </div>
  </div>
</body>
</html>`,
        });
      } catch (emailErr) {
        console.error("Failed to send acceptance email:", emailErr);
        // Don't fail the acceptance just because email failed
      }
    }

    return NextResponse.json({ success: true, acceptedAt: now });
  } catch (err) {
    console.error("Portal accept error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
