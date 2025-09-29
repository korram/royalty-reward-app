import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

// ถ้าใช้ @prisma/client (หลังลบ output)
import * as Prisma from '@prisma/client';
// ถ้าใช้ client แบบ custom output:
// import * as Prisma from '../../../generated/prisma';

export type OAuthProfile = {
  provider: 'google' | 'facebook';
  providerAccountId: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  avatar?: string;
};

@Injectable()
export class OAuthProviderService {
  async verifyGoogleIdToken(idToken: string): Promise<OAuthProfile> {
    // ใช้ google tokeninfo เพื่อลด lib; ถ้าต้อง OIDC เต็มๆ ใช้ google-auth-library ก็ได้
    const res = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: idToken },
      validateStatus: () => true,
    });

    if (res.status !== 200) {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const p = res.data as {
      sub: string; email?: string; email_verified?: 'true' | 'false';
      name?: string; picture?: string; aud?: string;
    };

    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && p.aud !== expectedClientId) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    return {
      provider: 'google',
      providerAccountId: p.sub,
      email: p.email,
      emailVerified: p.email_verified === 'true',
      name: p.name,
      avatar: p.picture,
    };
  }

  async verifyFacebookAccessToken(accessToken: string): Promise<OAuthProfile> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) {
      throw new UnauthorizedException('Facebook app credentials missing');
    }
    // 1) debug token
    const appToken = `${appId}|${appSecret}`;
    const dbg = await axios.get('https://graph.facebook.com/debug_token', {
      params: { input_token: accessToken, access_token: appToken },
      validateStatus: () => true,
    });
    if (dbg.status !== 200 || !dbg.data?.data?.is_valid) {
      throw new UnauthorizedException('Invalid Facebook access token');
    }

    const uid: string = dbg.data.data.user_id;

    // 2) fetch user profile
    const me = await axios.get('https://graph.facebook.com/v17.0/me', {
      params: { fields: 'id,name,email,picture.type(large)', access_token: accessToken },
      validateStatus: () => true,
    });
    if (me.status !== 200) {
      throw new UnauthorizedException('Cannot fetch Facebook user profile');
    }

    return {
      provider: 'facebook',
      providerAccountId: uid,
      email: me.data.email, // อาจว่างได้ ถ้าผู้ใช้ไม่ได้ให้สิทธิ์ email
      emailVerified: !!me.data.email, // FB ไม่มี email_verified แบบ Google; เอาง่ายๆ: มีอีเมลถือว่า verified
      name: me.data.name,
      avatar: me.data.picture?.data?.url,
    };
  }

  async verify(provider: 'google' | 'facebook', token: string): Promise<OAuthProfile> {
    if (provider === 'google') return this.verifyGoogleIdToken(token);
    return this.verifyFacebookAccessToken(token);
  }

  toPrismaProvider(p: 'google' | 'facebook'): Prisma.OAuthProvider {
    // Prisma enum เป็นตัวพิมพ์เล็ก
    return p === 'google' ? Prisma.OAuthProvider.google : Prisma.OAuthProvider.facebook;
  }
}
