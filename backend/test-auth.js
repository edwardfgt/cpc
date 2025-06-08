require('dotenv').config(); // Load environment variables from .env file

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const testEmail = process.env.TEST_EMAIL;

if (!supabaseUrl || !supabaseAnonKey || !testEmail) {
  console.error('Error: Please ensure SUPABASE_URL, SUPABASE_ANON_KEY, and TEST_EMAIL are set in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMagicLinkSignIn() {
  console.log(`Attempting to send magic link to: ${testEmail}`);
  try {
    const { data, error } = await supabase.auth.signInWithOtp({ email: testEmail });

    if (error) {
      console.error('Magic link sign-in failed:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      if (error.status === 500) {
        console.error('A 500 error often indicates an issue with your Supabase project\'s Email Settings (SMTP configuration). Please check your Supabase dashboard.');
      }
    } else {
      console.log('Magic link sign-in successful!');
      console.log('Response data:', data);
      console.log('Check your email for the magic link.');
    }
  } catch (e) {
    console.error('An unexpected error occurred:', e);
  }
}

testMagicLinkSignIn();
