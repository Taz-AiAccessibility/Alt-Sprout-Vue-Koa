import { Context } from 'koa';
import { supabase } from '../supabase';

export const saveLikedDescription = async (ctx: Context) => {
  try {
    console.log('🔍 Checking authentication...');

    // Retrieve token from HTTP-only cookie
    const token = ctx.cookies.get('supabase_token');

    if (!token) {
      console.error('❌ No authentication token found in cookies');
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: No authentication token found' };
      return;
    }

    console.log('🔑 Extracted token from cookies:', token);

    // Verify user session
    const { data, error: authError } = await supabase.auth.getUser(token);
    const user = data?.user; // ✅ Correctly extracting `user`

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      ctx.status = 401;
      ctx.body = {
        error: 'Unauthorized: Invalid session token',
        details: authError?.message || authError,
      };
      return;
    }

    console.log('✅ Authenticated user:', user.id);

    // Get the request body
    const {
      descriptionType,
      descriptionText,
      descriptionOrigin,
      subjects,
      targetAudience,
    } = ctx.request.body;

    if (
      !descriptionType ||
      !descriptionText ||
      !descriptionOrigin ||
      !subjects ||
      !targetAudience
    ) {
      console.error('❌ Missing required fields:', {
        descriptionType,
        descriptionText,
        descriptionOrigin,
        subjects,
        targetAudience,
      });
      ctx.status = 400;
      ctx.body = { error: 'Bad Request: Missing required fields' };
      return;
    }

    console.log('📝 Saving liked description:', {
      user_id: user.id,
      descriptionType,
      descriptionText,
      descriptionOrigin,
      subjects,
      targetAudience,
    });

    // Insert into Supabase
    const { data: insertData, error } = await supabase
      .from('liked_descriptions')
      .insert([
        {
          user_id: user.id, // Ensure user_id matches the authenticated user
          description_type: descriptionType,
          description_text: descriptionText,
          description_origin: descriptionOrigin, // Fix field name
          subjects: subjects,
          target_audience: targetAudience,
        },
      ]);

    if (error) {
      console.error('🔥 Supabase Error on INSERT:', error);
      throw error;
    }

    console.log('✅ Description saved successfully:', insertData);

    ctx.status = 200;
    ctx.body = { message: 'Description saved successfully', data: insertData };
  } catch (error: any) {
    console.error('🔥 Unexpected Server Error:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal Server Error: Error saving description',
      details: error.message || error,
    };
  }
};

export const getLikedDescriptions = async (ctx: Context) => {
  const userId = ctx.params.userId;

  if (!userId) {
    ctx.status = 400;
    ctx.body = { error: 'User ID is required' };
    return;
  }

  try {
    const { data, error } = await supabase
      .from('liked_descriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    ctx.status = 200;
    ctx.body = { data };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Error fetching liked descriptions', details: error };
  }
};
