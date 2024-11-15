'use client'
import { uploadToS3 } from '@/lib/s3';
import { Inbox } from 'lucide-react';
import React from 'react'
import {useDropzone} from'react-dropzone'


const FileUpload = () => {
    const {getRootProps, getInputProps } = useDropzone({
        accept: {"application/pdf": [".pdf"]},
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            console.log('Accepted files:', acceptedFiles);
            const file = acceptedFiles[0];
            if(file.size>10*1024*1024){
                alert("File size exceeds 10MB");
                return;
            }
            try{
                const data = await uploadToS3(file); 
                    console.log("File uploaded to S3:", data);
            }
            catch(error){
                console.error("Error uploading file to S3:", error);
                alert("Error uploading file to S3");
            }
            
        },
    });
  return (
    <div className='p-2 bg-white rounded-xl'>
        <div {...getRootProps({
          className:
            "border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col",
        })}>
             <input{...getInputProps()}/>    
             <>
             <Inbox className="w-10 h-10 text-blue-500" />
             <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p></>
        </div>
    </div>
  )
}

export default FileUpload