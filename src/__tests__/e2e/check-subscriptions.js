import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.clover' });

async function checkCancelledSubscriptions() {
  const subscriptions = await stripe.subscriptions.list({
    status: 'canceled',
    limit: 10
  });

  console.log('Recent CANCELLED subscriptions:');
  console.log('Found', subscriptions.data.length, 'cancelled subscriptions\n');

  for (const sub of subscriptions.data.slice(0, 5)) {
    console.log('---');
    console.log('ID:', sub.id);
    console.log('Status:', sub.status);
    console.log('Cancelled at:', sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null);
    console.log('Has discount:', Boolean(sub.discount));
    if (sub.discount) {
      console.log('Discount:', sub.discount.coupon?.percent_off + '% off');
    }

    if (sub.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(sub.latest_invoice);
      console.log('Invoice total:', invoice.total, 'cents');
      console.log('Invoice status:', invoice.status);
    }
  }
}

checkCancelledSubscriptions().catch(console.error);
