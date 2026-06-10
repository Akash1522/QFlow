import dotenv from 'dotenv';
dotenv.config();

export const sendOtpEmail = async (toEmail, otp, name = null, context = 'register') => {
  try {
    let subject, html;

    if (context === 'create-admin') {
      subject = 'Authorization Required: Create New Admin';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #111827; margin-bottom: 20px;">Admin Authorization Required</h2>
          <p style="color: #374151; font-size: 16px;">Hello ${name || 'Admin'},</p>
          <p style="color: #374151; font-size: 16px;">An action to <strong>create a new administrator</strong> requires your authorization.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Your OTP Code</p>
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5;">${otp}</span>
          </div>
          
          <p style="color: #ef4444; font-size: 14px; font-weight: bold;">This code expires in 5 minutes.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">If you did not request this, please secure your account immediately.</p>
        </div>
      `;
    } else {
      subject = 'Your QFlow Verification Code';
      html = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <tr>
            <td align="center">
              
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #8b5cf6; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1);">
                <tr>
                  <!-- Background Image Hosted on our Backend -->
                  <td background="https://qflow-backend.onrender.com/assets/otp_bg.png" bgcolor="#8b5cf6" width="600" height="340" valign="middle" style="background-image: url('https://qflow-backend.onrender.com/assets/otp_bg.png'); background-size: cover; background-position: right center; background-repeat: no-repeat;">
                    
                    <table border="0" cellspacing="0" cellpadding="0" width="100%" height="100%">
                      <tr>
                        <!-- Left area for the floating OTP box -->
                        <td width="300" valign="middle" style="padding: 40px; text-align: left;">
                          <div style="background-color: rgba(255,255,255,0.95); padding: 25px 25px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                            
                            <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                              <tr>
                                <td width="24"><img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" width="18" height="18" alt="QFlow" style="display: block;" /></td>
                                <td style="font-weight: 700; font-size: 13px; color: #111827;">QFlow</td>
                              </tr>
                            </table>

                            ${name ? `<p style="margin: 0 0 6px 0; font-size: 16px; font-weight: 800; color: #111827;">Hi ${name},</p>` : ''}
                            <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: bold; color: #374151;">Verification Code</p>
                            
                            <div style="margin: 0 0 15px 0;">
                              <span style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #7c3aed;">
                                ${otp}
                              </span>
                            </div>
                            
                            <p style="margin: 0; font-size: 12px; font-weight: 600; color: #ef4444;">Expires in 10 minutes</p>
                          </div>
                        </td>
                        <!-- Right area kept empty so the character shows through -->
                        <td width="300"></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">Secure verification by QFlow.</p>
            </td>
          </tr>
        </table>
      `;
    }

    const resendApiKey = process.env.RESEND_API_KEY || 're_Lt5kma7b_2zgzvSjxHdoiW9QWPiQhFtHV';

    // Call Resend API directly over standard HTTPS (bypasses all blocked SMTP ports)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'QFlow Management <onboarding@resend.dev>',
        to: toEmail,
        subject: subject,
        html: html
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('Live email sent via Resend API! ID:', data.id);
      return true;
    } else {
      console.error('Resend API Error:', data);
      return false;
    }
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    return false;
  }
};
