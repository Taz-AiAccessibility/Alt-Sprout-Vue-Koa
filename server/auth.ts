import passport from 'koa-passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import dotenv from 'dotenv';
import { supabase } from './supabase';

dotenv.config();

// Define the correct User Type and Override `Express.User`
export interface User {
  id: string; // UUID from Supabase
  google_id: string;
  email: string;
  name: string;
  avatar_url: string;
}

// Override the `User` Type to Avoid Express Conflicts
declare global {
  namespace Koa {
    interface Context {
      user?: User;
    }
  }
}

// Serialize user to session
passport.serializeUser((user: any, done) => {
  console.log('🔑 Serializing User:', user);
  done(null, (user as User).id);
});

// Deserialize
passport.deserializeUser(async (id: string, done) => {
  try {
    console.log('🔍 Attempting to deserialize user with ID:', id);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      console.error('❌ User not found or Supabase error:', error);
      return done(null, undefined);
    }

    console.log('✅ Successfully deserialized user:', user);
    return done(null, user);
  } catch (err) {
    console.error('❌ Unexpected error in deserializeUser:', err);
    return done(null, undefined);
  }
});

// Use `passport-oauth2` to get ID token
passport.use(
  'google',
  new OAuth2Strategy(
    {
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
      scope: ['profile', 'email', 'openid'],
    },

    // !!! how are accessToken and refreshToken used?
    async (accessToken, refreshToken, params, profile, done) => {
      try {
        console.log('✅ Google OAuth Response:', params);

        // Retrieve `id_token` correctly
        const idToken = params.id_token;

        if (!idToken) {
          console.error('❌ No valid ID token received from Google OAuth');
          return done(new Error('No valid ID token'), false);
        }

        console.log('✅ Google ID Token:', idToken);

        //  1: Authenticate with Supabase using the ID Token
        const { data: authUser, error: authError } =
          await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });

        if (authError || !authUser?.user) {
          console.error('❌ Error creating Supabase Auth session:', authError);
          return done(
            authError || new Error('Supabase authentication failed'),
            false
          );
        }

        console.log('✅ Supabase Auth User:', authUser);

        // Ensure `authUser.user` is defined before proceeding
        const supabaseUser = authUser.user;
        if (!supabaseUser.id || !supabaseUser.email) {
          console.error(
            '❌ Missing user information from Supabase:',
            supabaseUser
          );
          return done(new Error('Supabase user information missing'), false);
        }

        //  2: Check if user exists in Supabase
        // should we be using existingUserError
        // Inside OAuth2Strategy callback
        const { data: existingUser, error: existingUserError } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (existingUser) {
          console.log('✅ Existing user found:', existingUser);
          return done(null, existingUser); // ✅ Ensure user is passed to Passport
        }

        console.log('⚡ User does not exist, inserting...');

        // 3: Insert New User with Supabase Auth ID
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: supabaseUser.id,
              google_id: supabaseUser.user_metadata?.provider_id || profile.id,
              name:
                supabaseUser.user_metadata?.full_name ||
                profile.displayName ||
                '',
              avatar_url:
                supabaseUser.user_metadata?.avatar_url ||
                profile.photos[0]?.value ||
                '',
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          return done(insertError, false);
        }

        console.log('✅ User inserted successfully:', newUser);
        return done(null, newUser);
      } catch (err) {
        console.error('❌ Unexpected error:', err);
        return done(err as Error, false);
      }
    }
  )
);

export default passport;
