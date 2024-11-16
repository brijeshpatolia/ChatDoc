"use client";
import { uploadToS3 } from "@/lib/s3";
import { Inbox } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

const FileUpload = () => {
  const [isLoading, setIsLoading] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data; // Adjust based on the API response
    },
    onSuccess: (data) => {
      console.log("Mutation success", data);
      toast.success("File uploaded successfully");
      setIsLoading(false); // Stop loading
    },
    onError: (error) => {
      console.error("Mutation error", error);
      toast.error(
        "Error while uploading the file. Please try again. If the issue persists, contact support."
      );
      setIsLoading(false); // Stop loading
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log("Accepted files:", acceptedFiles);
      const file = acceptedFiles[0];

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB");
        return;
      }

      setIsLoading(true); // Start loading

      try {
        const data = await uploadToS3(file);
        if (!data?.file_key || !data?.file_name) {
          toast.error(
            "Something went wrong while uploading the file to S3. Please try again. If the issue persists, contact support."
          );
          setIsLoading(false); // Stop loading
          return;
        }

        mutation.mutate({ file_key: data.file_key, file_name: data.file_name });
        console.log("File uploaded to S3:", data);
      } catch (error) {
        console.error("Error uploading file to S3:", error);
        toast.error("Error uploading file to S3");
        setIsLoading(false); // Stop loading
      }
    },
  });

  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps({
          className: `border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex justify-center items-center flex-col ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`,
        })}
        style={{ pointerEvents: isLoading ? "none" : "auto" }}
      >
        <input {...getInputProps()} disabled={isLoading} />
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="loader w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-slate-400">Uploading...</p>
          </div>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400">Drop PDF Here</p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
