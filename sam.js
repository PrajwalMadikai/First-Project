const puppeteer = require('puppeteer');
const fs = require('fs');

exports.downloadInvoice = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({ email: req.session.userAuth });
        const order = await Order.findOne({ userId: user._id, 'products._id': id });
        const product = order.products.find(p => p._id.toString() === id);

        // Create the HTML for the invoice
        const html = `
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; }
                .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                .invoice-box h2 { text-align: center; }
                .invoice-table { width: 100%; border-collapse: collapse; }
                .invoice-table th, .invoice-table td { border: 1px solid #eee; padding: 8px; text-align: left; }
                .totals { text-align: right; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="invoice-box">
                <h2>Invoice</h2>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                <p><strong>Payment Method:</strong> ${order.paymentOption === 'cod' ? 'Cash On Delivery' : order.paymentOption}</p>
                <h3>Shipping Address</h3>
                <p>${order.address[0].house}, ${order.address[0].city}, ${order.address[0].district}, ${order.address[0].state} - ${order.address[0].pin}</p>
                <p>${order.address[0].phone}</p>
                <h3>Item Details</h3>
                <table class="invoice-table">
                  <tr>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                  <tr>
                    <td>${product._id}</td>
                    <td>${product.name}</td>
                    <td>${product.quantity}</td>
                    <td>₹${product.price}</td>
                    <td>${product.status}</td>
                    <td>₹${product.price * product.quantity}</td>
                  </tr>
                </table>
                <div class="totals">
                  <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
                  <p><strong>Applied Coupon:</strong> ${order.coupon_name || 'None'}</p>
                  <p><strong>Payable Amount:</strong> ₹${order.totalAmount}</p>
                </div>
              </div>
            </body>
          </html>
        `;

        // Launch Puppeteer and create the PDF
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        // Close the browser
        await browser.close();

        // Set response headers for PDF download
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}_${product._id}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
};
