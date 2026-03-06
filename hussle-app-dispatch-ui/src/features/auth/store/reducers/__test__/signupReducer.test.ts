import { signupReducer } from '../signupReducer';
import {  SignupParams } from '../../authSlice';
import { LoadingState } from "types/loadingState";

interface TestAuthState {
	loading: Record<string, LoadingState>;
	errors: Record<string, string>;
}

describe('signupReducer', () => {
	let state: TestAuthState;

	beforeEach(() => {
		state = {
			loading: {},
			errors: {},
		};
	});

	it('should handle signupRequest by setting loading to Pending', () => {
		const dummyPayload: SignupParams = {
			email: 'test@email.com',
			password: 'RandomPassword',
			firstName: 'Test',
			lastName: 'User',
			name: 'MerchantTest',
		};

		signupReducer.signupRequest(state, {
			type: 'auth/signupRequest',
			payload: dummyPayload,
		});
		expect(state.loading.signup).toBe(LoadingState.Pending);
	});

	it('handles signupSuccess', () => {
		const dummyPayload = {
			user: { email: '' },
			tenant: {},
		};
		signupReducer.signupSuccess(state, {
			type: 'auth/signupSuccess',
			payload: dummyPayload,
		});
		expect(state.loading.signup).toBe(LoadingState.Fulfilled);
		expect(state.errors.signup).toBe('');
	});

	it('handles signupFailure', () => {
		signupReducer.signupFailure(state);
		expect(state.loading.signup).toBe(LoadingState.Rejected);
		expect(state.errors.signup).toBe('Signup failed');
	});
});
