import * as Yup from 'yup';
export declare const passwordValidation: Yup.StringSchema<string, Yup.AnyObject, undefined, "">;
export declare const nameValidation: (fieldName: string) => Yup.StringSchema<string, Yup.AnyObject, undefined, "">;
export declare const longerNameValidation: (fieldName: string) => Yup.StringSchema<string, Yup.AnyObject, undefined, "">;
export declare const emailValidation: Yup.StringSchema<string, Yup.AnyObject, undefined, "">;
export declare const registerValidation: Yup.ObjectSchema<{
    email: string;
    firstName: string | null | undefined;
    lastName: string | null | undefined;
    name: string | null | undefined;
}, Yup.AnyObject, {
    email: undefined;
    firstName: undefined;
    lastName: undefined;
    name: undefined;
}, "">;
export declare const updateValidation: Yup.ObjectSchema<{
    contactEmail: string | null | undefined;
    name: string | null | undefined;
}, Yup.AnyObject, {
    contactEmail: undefined;
    name: undefined;
}, "">;
export declare const loginValidation: Yup.ObjectSchema<{
    email: string;
    password: string;
    rememeberMe: boolean | undefined;
}, Yup.AnyObject, {
    email: undefined;
    password: undefined;
    rememeberMe: undefined;
}, "">;
export declare const confirmationCodeValidation: Yup.ObjectSchema<{
    password: string;
    confirmPassword: string;
    confirmationCode: string;
}, Yup.AnyObject, {
    password: undefined;
    confirmPassword: undefined;
    confirmationCode: undefined;
}, "">;
export declare const initiatePasswordResetValidation: Yup.ObjectSchema<{
    email: string;
}, Yup.AnyObject, {
    email: undefined;
}, "">;
//# sourceMappingURL=validators.d.ts.map