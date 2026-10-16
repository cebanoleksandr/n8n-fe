import * as yup from 'yup'

// Limits mirror backend/src/modules/auth/auth.dto.ts and workspaces' DTOs.
// Messages are translation keys; FormTextField translates them.

export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('auth.validation.passwordRequired')
    .max(256, 'auth.validation.passwordTooLong'),
  newPassword: yup
    .string()
    .required('auth.validation.passwordRequired')
    .min(8, 'auth.validation.passwordTooShort')
    .max(256, 'auth.validation.passwordTooLong'),
  confirmPassword: yup
    .string()
    .required('auth.validation.confirmPasswordRequired')
    .oneOf([yup.ref('newPassword')], 'auth.validation.passwordsMismatch'),
})

export type ChangePasswordFormValues = yup.InferType<typeof changePasswordSchema>

export const workspaceNameSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('settings.validation.workspaceNameRequired')
    .max(128, 'auth.validation.workspaceNameTooLong'),
})

export type WorkspaceNameFormValues = yup.InferType<typeof workspaceNameSchema>

export const inviteSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('auth.validation.emailRequired')
    .email('auth.validation.emailInvalid')
    .max(254, 'auth.validation.emailTooLong'),
})

export type InviteFormValues = yup.InferType<typeof inviteSchema>
