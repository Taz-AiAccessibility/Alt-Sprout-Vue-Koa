import { Context } from 'koa';
import { getSupabaseClient } from '../supabase'; // ✅ Use the correct import

// ✅ Define request body type
interface LikedDescriptionRequest {
  descriptionType: string;
  descriptionText: string;
  descriptionOrigin: string;
  subjects: string;
  targetAudience: string;
}

export const saveLikedDescription = async (ctx: Context) => {
  try {
    console.log('🔍 Checking authentication...');

    const user = ctx.state.user;
    const token = ctx.headers.authorization?.split(' ')[1];

    if (!user || !user.id || !token) {
      console.error('❌ User session missing: likedDescriptionController');
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: User session not found' };
      return;
    }

    console.log('✅ Authenticated user');

    const body = ctx.request.body as Partial<LikedDescriptionRequest>;
    if (
      !body.descriptionType ||
      !body.descriptionText ||
      !body.descriptionOrigin ||
      !body.subjects ||
      !body.targetAudience
    ) {
      console.error('❌ Missing required fields:', body);
      ctx.status = 400;
      ctx.body = { error: 'Bad Request: Missing required fields' };
      return;
    }

    console.log('📝 Preparing to insert into Supabase');

    // ✅ Use Supabase with the user's token
    const supabaseClient = getSupabaseClient(token);

    const { data, error } = await supabaseClient
      .from('liked_descriptions')
      .insert([
        {
          user_id: user.id,
          description_type: body.descriptionType,
          description_text: body.descriptionText,
          description_origin: body.descriptionOrigin,
          subjects: body.subjects,
          target_audience: body.targetAudience,
        },
      ]);

    if (error) {
      console.error('🔥 Supabase INSERT Error:', error);
      throw error;
    }

    console.log('✅ Insert successful:', data);

    ctx.status = 201;
    ctx.body = { message: 'Description saved successfully', data };
  } catch (error: unknown) {
    console.error('🔥 Unexpected Server Error:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Internal Server Error: Error saving description',
      details: (error as Error).message || error,
    };
  }
};

export const getLikedDescriptions = async (ctx: Context) => {
  try {
    console.log(
      '🔍 Checking authentication for fetching liked descriptions...'
    );

    // ✅ Extract authenticated user
    const user = ctx.state.user;
    const token = ctx.headers.authorization?.split(' ')[1];

    if (!user || !user.id || !token) {
      ctx.status = 401;
      ctx.body = { error: 'Unauthorized: User session not found' };
      return;
    }

    // ✅ Use Supabase with the user's token
    const supabaseClient = getSupabaseClient(token);

    const { data: likedDescriptions, error } = await supabaseClient
      .from('liked_descriptions')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('🔥 Supabase Error on SELECT:', error);
      throw error;
    }

    console.log('✅ Liked descriptions retrieved successfully.');

    ctx.status = 200;
    ctx.body = { data: likedDescriptions };
  } catch (error: unknown) {
    console.error('🔥 Unexpected Server Error:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Error fetching liked descriptions',
      details: (error as Error).message || error,
    };
  }
};
