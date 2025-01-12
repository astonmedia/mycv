import { UsersService } from './users.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // Logic to create a new user
    // See if email is in use
    const users = await this.usersService.findOneByEmail(email);
    if (users.length > 0) {
      throw new BadRequestException('Email in use');
    }
    // Hash user's password
    // Salt the password
    const salt = randomBytes(8).toString('hex');
    // Hash the password
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    // Join the hashed result and the salt
    const result = `${salt}.${hash.toString('hex')}`;
    // Create a new user and save it
    const user = await this.usersService.create(email, result);
    // Return the user
    return user;
  }

  async signin(email: string, password: string) {
    // Logic to sign in a user
    // Find the user
    const [user] = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Compare the user's password with the hashed password
    const [salt, storedHash] = user.password.split('.');
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('Invalid credentials');
    }
    // Return the user
    return user;
  }
}
