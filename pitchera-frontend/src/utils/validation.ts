import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name too long')
      .trim(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name too long')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const recruiterSchema = z.object({
  name: z.string().min(1, 'Recruiter name is required').trim(),
  email: z
    .string()
    .min(1, 'Recruiter email is required')
    .email('Invalid recruiter email'),
});

export const jobApplicationSchema = z.object({
  company: z.string().min(1, 'Company name is required').trim(),
  jobTitle: z.string().min(1, 'Job title is required').trim(),
  jobUrl: z.string().url('Invalid job URL').optional().or(z.literal('')),
  jobDescription: z.string().optional(),
  recruiters: z
    .array(recruiterSchema)
    .min(1, 'At least one recruiter is required')
    .refine(
      (recruiters) => {
        const emails = recruiters.map((r) => r.email.toLowerCase());
        return new Set(emails).size === emails.length;
      },
      { message: 'Duplicate recruiter emails are not allowed' }
    ),
  useDefaultTemplate: z.boolean(),
  customEmail: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;