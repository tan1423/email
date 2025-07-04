import axios, { endpoints } from 'src/utils/axios-util';

import { setSession } from './utils';

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const loginResponse = res.data;

    if (loginResponse.status !== 'success') {
      throw new Error('Error during sign in.');
    }

  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, first_name, last_name }) => {
  const params = {
    email,
    password,
    first_name,
    last_name,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const signupResponse = res.data;

    if (signupResponse.status !== 'success') {
      throw new Error('Error during sign up');
    }
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};
