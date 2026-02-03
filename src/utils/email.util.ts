export const generatePasswordResetEmail = (resetUrl: string, fullName: string): string => {
    return `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jelszó visszaállítás</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #40B4E5;">
                            <h1 style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                                Duális Képzési Központ
                            </h1>
                            <p style="margin: 8px 0 0; color: #FF6B35; font-size: 13px; font-weight: 500;">
                                NEUMANN JÁNOS EGYETEM
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 24px; color: #2c3e50; font-size: 22px; font-weight: 600;">Jelszó visszaállítás</h2>
                            
                            <p style="margin: 0 0 16px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Kedves <strong>${fullName}</strong>!
                            </p>
                            
                            <p style="margin: 0 0 24px; color: #555555; font-size: 15px; line-height: 1.6;">
                                Jelszó visszaállítási kérést kaptunk a fiókodhoz. Ha te kezdeményezted ezt, kattints az alábbi gombra a jelszavad megváltoztatásához:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #40B4E5 0%, #2E9FD1 100%); box-shadow: 0 4px 12px rgba(64, 180, 229, 0.3);">
                                        <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; letter-spacing: 0.3px;">
                                            Jelszó visszaállítása →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 12px; color: #777777; font-size: 14px; line-height: 1.5;">
                                Vagy másold be az alábbi linket a böngésződbe:
                            </p>
                            
                            <p style="margin: 0 0 24px; padding: 12px; background-color: #f8f9fa; color: #40B4E5; font-size: 13px; line-height: 1.6; word-break: break-all; border-radius: 4px; border-left: 3px solid #40B4E5;">
                                ${resetUrl}
                            </p>
                            
                            <div style="margin-top: 32px; padding: 20px; background-color: #fff3e0; border-radius: 6px; border-left: 4px solid #FF6B35;">
                                <p style="margin: 0 0 12px; color: #FF6B35; font-size: 14px; font-weight: 600;">
                                    ⚠️ Fontos biztonsági információ
                                </p>
                                <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.7;">
                                    <li>Ez a link <strong>2 óráig érvényes</strong>.</li>
                                    <li>Ha nem te kérted a jelszó visszaállítást, hagyd figyelmen kívül ezt az emailt.</li>
                                    <li>Ne oszd meg ezt a linket senkivel!</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #fafafa; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                                Ez egy automatikus email, kérjük ne válaszolj rá.<br>
                                © ${new Date().getFullYear()} Duális Képzési Központ - Neumann János Egyetem
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

export const generateVerificationEmail = (verificationUrl: string, fullName: string): string => {
    return `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email megerősítés</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff; border-bottom: 3px solid #40B4E5;">
                            <h1 style="margin: 0; color: #2c3e50; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                                Duális Képzési Központ
                            </h1>
                            <p style="margin: 8px 0 0; color: #FF6B35; font-size: 13px; font-weight: 500;">
                                NEUMANN JÁNOS EGYETEM
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 24px; color: #2c3e50; font-size: 22px; font-weight: 600;">Email megerősítés</h2>
                            
                            <p style="margin: 0 0 16px; color: #333333; font-size: 16px; line-height: 1.6;">
                                Kedves <strong>${fullName}</strong>!
                            </p>
                            
                            <p style="margin: 0 0 24px; color: #555555; font-size: 15px; line-height: 1.6;">
                                Köszönjük, hogy regisztráltál a Duális Képzési Központ rendszerébe. Kérjük, erősítsd meg az email címedet az alábbi gombra kattintva:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0;">
                                <tr>
                                    <td style="border-radius: 6px; background: linear-gradient(135deg, #40B4E5 0%, #2E9FD1 100%); box-shadow: 0 4px 12px rgba(64, 180, 229, 0.3);">
                                        <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; letter-spacing: 0.3px;">
                                            Email megerősítése →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 12px; color: #777777; font-size: 14px; line-height: 1.5;">
                                Vagy másold be az alábbi linket a böngésződbe:
                            </p>
                            
                            <p style="margin: 0 0 24px; padding: 12px; background-color: #f8f9fa; color: #40B4E5; font-size: 13px; line-height: 1.6; word-break: break-all; border-radius: 4px; border-left: 3px solid #40B4E5;">
                                ${verificationUrl}
                            </p>
                            
                            <div style="margin-top: 32px; padding: 20px; background-color: #e3f2fd; border-radius: 6px; border-left: 4px solid #40B4E5;">
                                <p style="margin: 0 0 12px; color: #2c3e50; font-size: 14px; font-weight: 600;">
                                    ℹ️ Miért van erre szükség?
                                </p>
                                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.7;">
                                    A megerősítés biztosítja, hogy a megadott email cím valóban hozzád tartozik, és ezen keresztül biztonságosan kommunikálhassunk veled a képzés során.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #fafafa; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                                Ez egy automatikus email, kérjük ne válaszolj rá.<br>
                                © ${new Date().getFullYear()} Duális Képzési Központ - Neumann János Egyetem
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};
