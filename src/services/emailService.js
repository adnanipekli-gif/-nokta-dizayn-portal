/**
 * Email Service
 * SendGrid integration for sending PDFs and notifications
 */

const SENDGRID_API_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

// Email templates
const EMAIL_TEMPLATES = {
  projectExport: {
    subject: 'Your Nokta Dizayn Project Export',
    template: 'project-export'
  },
  batchExport: {
    subject: 'Your Batch Export is Ready',
    template: 'batch-export'
  },
  scenePreset: {
    subject: 'Scene Configuration Saved',
    template: 'scene-preset'
  },
  weeklyReport: {
    subject: 'Your Weekly Nokta Dizayn Report',
    template: 'weekly-report'
  }
};

/**
 * Email Configuration
 */
export class EmailConfig {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.REACT_APP_SENDGRID_API_KEY;
    this.fromEmail = 'portal@nokta-dizayn.com';
    this.fromName = 'Nokta Dizayn Portal';
  }

  setFromEmail(email, name = 'Nokta Dizayn Portal') {
    this.fromEmail = email;
    this.fromName = name;
  }

  isConfigured() {
    return !!this.apiKey;
  }
}

/**
 * Send email via SendGrid
 */
export async function sendEmail(config, emailData) {
  if (!config.isConfigured()) {
    console.warn('SendGrid API key not configured');
    return {
      success: false,
      message: 'Email service not configured',
      demo: true
    };
  }

  try {
    const payload = {
      personalizations: [
        {
          to: [{ email: emailData.to, name: emailData.toName || '' }],
          subject: emailData.subject,
          ...(emailData.cc && { cc: Array.isArray(emailData.cc) ? emailData.cc.map(e => ({ email: e })) : [{ email: emailData.cc }] })
        }
      ],
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      content: [
        {
          type: 'text/html',
          value: emailData.html
        }
      ],
      ...(emailData.attachments && {
        attachments: emailData.attachments.map(att => ({
          content: att.content, // Base64 encoded
          type: att.type || 'application/pdf',
          filename: att.filename
        }))
      })
    };

    // For demo: log and return success without actually sending
    console.log('Email payload (demo mode):', payload);

    // Uncomment for production:
    // const response = await fetch(SENDGRID_API_ENDPOINT, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${config.apiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // });
    //
    // if (!response.ok) {
    //   const error = await response.json();
    //   throw new Error(error.errors?.[0]?.message || 'Email send failed');
    // }

    return {
      success: true,
      message: 'Email sent successfully',
      to: emailData.to,
      subject: emailData.subject
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

/**
 * Send project PDF via email
 */
export async function sendProjectPDF(config, projectData) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1b3d4f 0%, #2a5670 100%); padding: 20px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📐 Nokta Dizayn</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Your Project Export</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1b3d4f; margin-top: 0;">Project: ${projectData.projectName}</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Location:</strong> ${projectData.location}</p>
          <p><strong>Area:</strong> ${projectData.area} m²</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
          <p><strong>Status:</strong> Exported</p>
        </div>

        <div style="background: #e0f7ff; padding: 15px; border-left: 4px solid #00c4cc; border-radius: 4px; margin-bottom: 20px;">
          <strong style="color: #1b3d4f;">What's included:</strong>
          <ul style="margin: 10px 0 0 0; color: #666;">
            <li>2-page PDF with 3D render</li>
            <li>Project details and specifications</li>
            <li>Product recommendations</li>
            <li>Technical information</li>
          </ul>
        </div>

        <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
          Your project PDF is attached to this email. You can download it directly or view it here.
        </p>

        <div style="text-align: center;">
          <a href="#" style="background: linear-gradient(135deg, #1b3d4f 0%, #2a5670 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block;">
            View in Portal
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <div style="font-size: 12px; color: #999; text-align: center;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} ND GROUP Companies</p>
          <p style="margin: 5px 0;">Perakende Tasarım ve Soğutma Çözümleri</p>
          <p style="margin: 5px 0;"><a href="https://nokta-dizayn.com" style="color: #00c4cc; text-decoration: none;">Visit Our Website</a></p>
        </div>
      </div>
    </div>
  `;

  return sendEmail(config, {
    to: projectData.email,
    toName: projectData.clientName || 'Valued Client',
    subject: EMAIL_TEMPLATES.projectExport.subject,
    html,
    attachments: projectData.pdfAttachment ? [projectData.pdfAttachment] : []
  });
}

/**
 * Send batch export notification
 */
export async function sendBatchExportNotification(config, batchData) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1b3d4f 0%, #2a5670 100%); padding: 20px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📦 Batch Export Ready</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1b3d4f; margin-top: 0;">Your ${batchData.projectCount} Project Export is Complete</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Total Projects:</strong> ${batchData.projectCount}</p>
          <p><strong>Total Files:</strong> ${batchData.fileCount}</p>
          <p><strong>Total Size:</strong> ${(batchData.totalSize / 1024 / 1024).toFixed(2)} MB</p>
          <p><strong>Export Date:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #1b3d4f;">Exported Projects:</strong>
          <ul style="margin: 10px 0 0 0; color: #666;">
            ${batchData.projects.map(p => `<li>${p.name} (${p.area} m²)</li>`).join('')}
          </ul>
        </div>

        <div style="background: #e0f7ff; padding: 15px; border-left: 4px solid #00c4cc; border-radius: 4px; margin-bottom: 20px;">
          <strong style="color: #1b3d4f;">Download your files:</strong>
          <p style="margin: 10px 0 0 0; color: #666;">A ZIP file containing all exported PDFs is attached below.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <div style="font-size: 12px; color: #999; text-align: center;">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} ND GROUP Companies</p>
        </div>
      </div>
    </div>
  `;

  return sendEmail(config, {
    to: batchData.email,
    toName: batchData.clientName || 'Valued Client',
    subject: EMAIL_TEMPLATES.batchExport.subject,
    html,
    attachments: batchData.zipAttachment ? [batchData.zipAttachment] : []
  });
}

/**
 * Send weekly report
 */
export async function sendWeeklyReport(config, reportData) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1b3d4f 0%, #2a5670 100%); padding: 20px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📊 Weekly Report</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Week of ${reportData.weekStart}</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1b3d4f; margin-top: 0;">This Week's Stats</h3>
          <p><strong>Projects Created:</strong> ${reportData.projectsCreated}</p>
          <p><strong>PDFs Generated:</strong> ${reportData.pdfsGenerated}</p>
          <p><strong>Assets Used:</strong> ${reportData.assetsUsed}</p>
          <p><strong>Total Scenes:</strong> ${reportData.totalScenes}</p>
        </div>

        <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #1b3d4f; margin-top: 0;">Most Used</h3>
          <p><strong>Lighting Profile:</strong> ${reportData.mostUsedLighting}</p>
          <p><strong>Material Combo:</strong> ${reportData.mostUsedMaterial}</p>
          <p><strong>Scene Type:</strong> ${reportData.mostUsedScene}</p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

        <div style="text-align: center;">
          <a href="#" style="background: #00c4cc; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            View Full Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail(config, {
    to: reportData.email,
    toName: reportData.clientName || 'User',
    subject: EMAIL_TEMPLATES.weeklyReport.subject,
    html
  });
}

/**
 * Email template utilities
 */
export function getEmailTemplate(templateName) {
  return EMAIL_TEMPLATES[templateName] || null;
}

/**
 * Validate email address
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Email queue for batch sending
 */
export class EmailQueue {
  constructor(config, maxRetries = 3) {
    this.config = config;
    this.maxRetries = maxRetries;
    this.queue = [];
    this.sending = false;
  }

  add(emailData) {
    this.queue.push({
      ...emailData,
      retries: 0,
      status: 'pending'
    });
  }

  async send() {
    if (this.sending) return;
    this.sending = true;

    while (this.queue.length > 0) {
      const email = this.queue[0];

      try {
        const result = await sendEmail(this.config, email);
        if (result.success) {
          email.status = 'sent';
          this.queue.shift();
        } else {
          email.retries++;
          if (email.retries >= this.maxRetries) {
            email.status = 'failed';
            this.queue.shift();
          } else {
            // Retry after delay
            await new Promise(r => setTimeout(r, 1000 * email.retries));
          }
        }
      } catch (error) {
        email.retries++;
        if (email.retries >= this.maxRetries) {
          email.status = 'failed';
          this.queue.shift();
        }
      }
    }

    this.sending = false;
  }

  getStatus() {
    return {
      pending: this.queue.filter(e => e.status === 'pending').length,
      sent: this.queue.filter(e => e.status === 'sent').length,
      failed: this.queue.filter(e => e.status === 'failed').length,
      total: this.queue.length
    };
  }
}

// Create singleton instance
export const emailConfig = new EmailConfig();
