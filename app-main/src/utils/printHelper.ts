/**
 * Universal safe print helper for modern web and embedded iframes.
 * Avoids window.open popup blocker issues by using a hidden iframe.
 */

export function printHtmlDocument(title: string, htmlBody: string): void {
  try {
    // Remove any previous print iframes
    const oldIframe = document.getElementById('mbk-print-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'mbk-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      // Fallback
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: 'Cairo', system-ui, -apple-system, sans-serif;
              direction: rtl;
              text-align: right;
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #0f172a;
            }
            @media print {
              body { background: #ffffff !important; color: #000000 !important; }
            }
          </style>
        </head>
        <body>
          ${htmlBody}
        </body>
      </html>
    `);
    doc.close();

    // Trigger print after resources load
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err);
        window.print();
      }
    }, 400);
  } catch (e) {
    console.error('Print helper error:', e);
    window.print();
  }
}
