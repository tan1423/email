import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Button from '@mui/material/Button';

import { logoutUser } from 'src/redux/slice/userSlice';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, ...other }) {
  const dispatch = useDispatch();
  const { checkUserSession } = useAuthContext();

  const handleLogout = useCallback(async () => {
    try {
      // await signOut();
      await checkUserSession?.();
      dispatch(logoutUser()); // Trigger the thunk to logout user session
      onClose?.();
      window.location.href = '/';
    } catch (error) {
      console.error(error);
    }
  }, [dispatch, checkUserSession, onClose]);

  return (
    <Button fullWidth variant="soft" size="large" color="error" onClick={handleLogout} {...other}>
      Logout
    </Button>
  );
}
