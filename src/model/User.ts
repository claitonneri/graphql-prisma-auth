import { Field, ID, ObjectType } from 'type-graphql';
import { IsEmail } from 'class-validator';

@ObjectType()
export default class User {
  @Field(type => ID)
  id: string;

  @Field()
  @IsEmail()
  email: string;

  @Field(type => String)
  password: string;

  @Field(type => Date)
  createdAt: Date;

  @Field(type => Date)
  updatedAt: Date;
}
