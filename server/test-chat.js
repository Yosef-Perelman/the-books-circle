import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { supabase } from './src/config/supabase.js';

dotenv.config();

// Create a valid token for testing
const testUserId = '9524ed14-c1a1-457d-b319-5329add92f84';

async function test() {
  try {
    // get a session using service role if we can't create one. Or just bypass auth for local test.
    console.log("We can't easily sign a JWT for Supabase in node without the JWT secret (which might be in Supabase dash, not .env)");
  } catch (err) {
    console.error(err);
  }
}
test();
