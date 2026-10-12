import * as yup from 'yup'

// Limits mirror backend/src/modules/auth/auth.dto.ts.
// Messages are translation keys; FormTextField translates them.

const email = yup
  .string()
  .trim()
  .required('auth.validation.emailRequired')
  .email('auth.validation.emailInvalid')
  .max(254, 'auth.validation.emailTooLong')

export const loginSchema = yup.object({
  email,
  password: yup
    .string()
    .required('auth.validation.passwordRequired')
    .max(256, 'auth.validation.passwordTooLong'),
})

export type LoginFormValues = yup.InferType<typeof loginSchema>

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('auth.validation.nameRequired')
    .max(128, 'auth.validation.nameTooLong'),
  email,
  password: yup
    .string()
    .required('auth.validation.passwordRequired')
    .min(8, 'auth.validation.passwordTooShort')
    .max(256, 'auth.validation.passwordTooLong'),
  confirmPassword: yup
    .string()
    .required('auth.validation.confirmPasswordRequired')
    .oneOf([yup.ref('password')], 'auth.validation.passwordsMismatch'),
  workspaceName: yup
    .string()
    .trim()
    .max(128, 'auth.validation.workspaceNameTooLong'),
})

export type RegisterFormValues = yup.InferType<typeof registerSchema>
