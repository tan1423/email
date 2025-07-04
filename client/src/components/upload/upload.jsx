import { useDispatch, useSelector } from 'react-redux';
import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';

import { Box, IconButton, Typography } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios-util';

import { varAlpha } from 'src/theme/styles';
import { setList } from 'src/redux/slice/listSlice';
import {
  startUpload,
  resetUpload,
  finishUpload,
  updateProgress,
  setUploadedListId,
} from 'src/redux/slice/uploadSlice';

import { Iconify } from '../iconify';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const FileUpload = forwardRef(
  (
    {
      fileName,
      fileErrorMessage,
      placeholder,
      error,
      disabled,
      sx,
      onFileUpload,
      selectedFile,
      uploadInformation,
      allowedFileTypes,
      setAlertState, // Add this prop
      ...other
    },
    ref
  ) => {
    const [localSelectedFile, setLocalSelectedFile] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);
    const fileInputRef = useRef(null);
    const dispatch = useDispatch();
    const lists = useSelector((state) => state?.list?.data);
    useImperativeHandle(ref, () => ({
      resetFile: () => {
        setLocalSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
    }));

    const handleAlertClose = () => {
      setAlertState((prev) => ({ ...prev, open: false }));
    };

    const validateFile = (file) => {
      if (file.size > MAX_FILE_SIZE) {
        setAlertState({
          open: true,
          color: 'error',
          title: 'Error',
          message: 'The selected file exceeds the maximum size limit of 10MB',
          status: 'Please choose a smaller file',
        });
        setTimeout(() => {
          handleAlertClose();
        }, 3000);
        return false;
      }
      if (allowedFileTypes && !allowedFileTypes.includes(file.type)) {
        setErrorMessage(fileErrorMessage);
        return false;
      }
      return true;
    };

    const handleFileChange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        if (!validateFile(file)) {
          event.target.value = '';
          return;
        }
        try {
          setErrorMessage(null);
          setLocalSelectedFile(file);
          dispatch(startUpload());
          const progress = 10;
          // dispatch(updateProgress(progress));

          const formData = new FormData();
          formData.append('file', file);

          // await axios.post('http://localhost:3000/reciveStreamEmails', formData, {
          await axiosInstance
            .post(endpoints.list.upload, formData, {
              //
              headers: {
                'Content-Type': 'multipart/form-data',
                'File-Name': file.name,
              },
              onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                dispatch(updateProgress(percentCompleted));
                // setProgress(percentCompleted);
              },
            })
            .then((res) => {
              if (res.status === 201) {
                const newLists = [res.data.data, ...lists.listData];

                dispatch(setUploadedListId(res.data.data._id));
                dispatch(setList(newLists));
                dispatch(finishUpload());
              }
            });
        } catch (e) {
          setErrorMessage('Something went wrong');
          dispatch(resetUpload());
        }
      }
      event.target.value = '';
    };

    const handleButtonClick = (event) => {
      event.preventDefault();
      fileInputRef.current.click();
    };

    const handleDragOver = (event) => {
      event.preventDefault();
    };

    const handleDrop = (event) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        if (!validateFile(file)) {
          return;
        }
        setErrorMessage(null);
        setLocalSelectedFile(file);
        onFileUpload(file);
      }
    };

    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={allowedFileTypes.join(',')}
          style={{ display: 'none' }}
          {...other}
        />
        <Box
          onClick={handleButtonClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            cursor: 'pointer',
            padding: '20px 20px 20px 20px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 1,
            alignItems: 'center',
            color: 'text.disabled',
            justifyContent: 'center',
            bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            border: (theme) =>
              `dashed 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
            ...(disabled && { opacity: 0.48, pointerEvents: 'none' }),
            ...(error && {
              color: 'error.main',
              borderColor: 'grey',
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            }),
          }}
        >
          <IconButton size="large" component="span" disabled={disabled}>
            <Iconify width={32} icon="eva:cloud-upload-fill" />
          </IconButton>
          <Typography
            variant="span"
            sx={{
              width: '100%',
              wordBreak: 'break-all',
              whiteSpace: 'normal',
              textAlign: 'center',
            }}
          >
            {uploadInformation.includes('Sample File') ? (
              <span>
                <Box display="flex" justifyContent="center" gap={0.6}>
                  <Typography sx={{ cursor: 'pointer' }}>Choose a file</Typography>
                  or drag it here.
                </Box>
                Supports: CSV
              </span>
            ) : (
              uploadInformation
            )}
          </Typography>

          {errorMessage && (
            <Typography
              variant="body1"
              sx={{
                color: 'error.main',
                textAlign: 'center',
                mt: 1,
              }}
            >
              {errorMessage}
            </Typography>
          )}
          {(selectedFile || localSelectedFile) && (
            <Typography
              variant="body1"
              sx={{
                width: '100%',
                wordBreak: 'break-all',
                whiteSpace: 'normal',
                textAlign: 'center',
              }}
            >
              Selected file: {selectedFile ? selectedFile.name : localSelectedFile.name}
            </Typography>
          )}
        </Box>
      </>
    );
  }
);

export default FileUpload;
