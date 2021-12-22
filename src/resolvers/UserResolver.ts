import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from 'type-graphql';
import { compare, hash } from 'bcryptjs';
import { v4 as uuid } from 'uuid';

import { Context } from '../context';
import User from '../model/User';

@InputType()
class UserInputData {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
class UserWithToken {
  @Field()
  user: User;

  @Field()
  token: string;
}

@Resolver()
export class UserResolver {
  @Query(returns => User, { nullable: true })
  async privateInfo(
    @Arg('token') token: string,
    @Ctx() ctx: Context,
  ): Promise<User | null> {
    const dbToken = await ctx.prisma.token.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });

    if (!dbToken) {
      throw new Error('Token not exists.');
    }

    const { user } = dbToken;

    return user;
  }

  @Mutation(returns => User)
  async signUp(
    @Arg('data') data: UserInputData,
    @Ctx() ctx: Context,
  ): Promise<User> {
    const hashedPassword = await hash(data.password, 10);
    return ctx.prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
  }

  @Mutation(returns => UserWithToken)
  async login(
    @Arg('data') data: UserInputData,
    @Ctx() ctx: Context,
  ): Promise<{ user: User; token: string } | null> {
    const user = await ctx.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('User not exists.');
    }

    const validation = await compare(data.password, user?.password);

    if (!validation) {
      throw new Error('Password not matched.');
    }

    const token = await ctx.prisma.token.create({
      data: { token: uuid(), user: { connect: { id: user.id } } },
    });

    return { user, token: token.token };
  }
}
