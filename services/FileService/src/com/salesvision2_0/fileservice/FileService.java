/*Copyright (c) 2015-2016 wavemaker-com All Rights Reserved.This software is the confidential and proprietary information of wavemaker-com You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the source code license agreement you entered into with wavemaker-com*/

package com.salesvision2_0.fileservice;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.manager.FileServiceManager;
import com.wavemaker.runtime.util.WMRuntimeUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.activation.MimetypesFileTypeMap;
import javax.annotation.PostConstruct;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import com.wavemaker.runtime.service.annotations.ExposeToClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * File service class with methods to upload, download, list and delete files.
 * This is a singleton class with all of its public methods exposed to the client via controller.
 * Their return values and parameters will be passed to the client or taken
 * from the client respectively.
 */
@ExposeToClient
public class FileService {

    private static final Logger logger=LoggerFactory.getLogger(FileService.class);

    @Autowired
    private FileServiceManager fileServiceManager;

    private File uploadDirectory = null;

    @PostConstruct
    protected void init() {
        uploadDirectory = getUploadDir();
    }


    /**
     * *******************************************************************************
     * INNER CLASS: WMFile
     * DESCRIPTION:
     * The class WMFile is a class used to represent information about a list of files.
     * An array of WMFile objects is returned when the client asks for a list of files
     * on the server.
     * ********************************************************************************
     */
    public class WMFile {
        private String path;
        private String name;
        private long size;
        private String type;

        public WMFile(String path, String name, long size, String type) {
            this.path = path;
            this.name = name;
            this.size = size;
            this.type = type;
        }

        public String getPath() {
            return path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public long getSize() {
            return size;
        }

        public void setSize(long size) {
            this.size = size;
        }
    }

    /*
        The class returns filepath, name , boolean success tells whether the upload was successful or not
        and error message if the upload was not successful.
     */
    public class FileUploadResponse {

        private String path;
        private String fileName;
        private long length;

        private boolean success;
        private String errorMessage;

        public FileUploadResponse(String path, String name, long length, boolean success, String errorMessage) {
            this.path = path;
            this.fileName = name;
            this.length = length;
            this.success = success;
            this.errorMessage = errorMessage;
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public long getLength() {
            return length;
        }

        public void setLength(int length) {
            this.length = length;
        }

        public String getErrorMessage() {
            return errorMessage;
        }

        public void setErrorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
        }

        public String getPath() {
            return this.path;
        }

        public void setPath(String path) {
            this.path = path;
        }

        public void setFileName(String fileName) {
            this.fileName = fileName;
        }

        public String getFileName() {
            return fileName;
        }
    }

    /**
     * *****************************************************************************
     * TEMPLATE PROPERTY: uploadDir
     * DESCRIPTION
     * When you created your java service, you were prompted to enter a value for
     * uploadDir.  The uploadDir is the default location to store files, and any
     * request to delete or download files that contains a relative path will
     * search for the file starting from uploadDir.
     * NOTES:
     * You can change this value at any time.
     * You may need to set a different uploadDir for your deployment environment
     * than you used on your local development environment.
     * ******************************************************************************
     */
    protected File getUploadDir() {
        String uploadDir = WMAppContext.getInstance().getContext().getRealPath("/resources/uploads");
        File f = new File(uploadDir);
        f.mkdirs();
        return f;
    }

    /**
     * *****************************************************************************
     * NAME: uploadFile
     * DESCRIPTION:
     * The FileUpload widget automatically calls this method whenever the user selects a new file.
     * <p/>
     * PARAMS:
     * file : multipart file to be uploaded.
     * relativePath : This is the relative path where file will be uploaded.
     * <p/>
     * RETURNS FileUploadResponse.
     * This has the following fields
     * Path: tells the client where the file was stored so that the client can identify the file to the server
     * Name: tells the client what the original name of the file was so that any
     * communications with the end user can use a filename familiar to that user.
     * Type: returns type information to the client, based on filename extensions (.txt, .pdf, .gif, etc...)
     * ******************************************************************************
     */
    public FileUploadResponse[] uploadFile(MultipartFile[] files, String relativePath, HttpServletRequest httpServletRequest) {
        List<FileUploadResponse> wmFileList = new ArrayList<>();
        File outputFile = null;
        for (MultipartFile file : files) {
            try {
                outputFile = fileServiceManager.uploadFile(file, relativePath, uploadDirectory);
                // Create WMFile object
                wmFileList.add(new FileUploadResponse(WMRuntimeUtils.getContextRelativePath(outputFile, httpServletRequest), outputFile.getName(), outputFile.length(), true, ""));
            } catch (Exception e) {
                wmFileList.add(new FileUploadResponse(null, file.getOriginalFilename(), 0, false, e.getMessage()));
            }
        }
        return wmFileList.toArray(new FileUploadResponse[wmFileList.size()]);
    }


    /**
     * *****************************************************************************
     * NAME: listFiles
     * DESCRIPTION:
     * Returns a description of every file in the uploadDir.
     * RETURNS array of inner class WMFile (defined above)
     * ******************************************************************************
     */
    public WMFile[] listFiles(HttpServletRequest httpServletRequest) throws IOException {
        MimetypesFileTypeMap m = new MimetypesFileTypeMap();
        File[] files = fileServiceManager.listFiles(uploadDirectory);

              /* Iterate over every file, creating a WMFile object to be returned */
        WMFile[] result = new WMFile[files.length];
        for (int i = 0; i < files.length; i++) {
            String filteredPath = WMRuntimeUtils.getContextRelativePath(files[i], httpServletRequest);
            result[i] = new WMFile(filteredPath, files[i].getName(), files[i].length(), m.getContentType(files[i]));
        }
        return result;
    }

    /**
     * *****************************************************************************
     * NAME: deleteFile
     * DESCRIPTION:
     * Deletes the files with the given path or name.  If the parameters are just file
     * names, it will look for files of that name in the uploadDir.  If its a full path
     * will delete the file at that path IF that path is within the uploadDir.
     * RETURNS boolean to indicate if success or failure of operation.
     * **************************************************************************
     */
    public boolean deleteFile(String file) throws IOException {
        return fileServiceManager.deleteFile(file, uploadDirectory);
    }

    /**
     * *****************************************************************************
     * NAME: downloadFile
     * DESCRIPTION:
     * The specified file will be downloaded to the user's computer.
     * - file: filename (if the file is in uploadDir) or path
     * - returnName: Optional string; if used, then this is the name that the user will see
     * for the downloaded file.  Else its name matches whats on the server.
     * RETURNS DownloadResponse instance
     * **************************************************************************
     */
    public DownloadResponse getDownloadFile(String file, String returnName) throws Exception {
        return downloadFile(file, returnName, false);
    }

    /**
     * *****************************************************************************
     * NAME: getDownloadFileAsInline
     * DESCRIPTION:
     * The specified file will be downloaded to the user's computer.
     * - file: filename (if the file is in uploadDir) or path
     * - returnName: Optional string; if used, then this is the name that the user will see
     * for the downloaded file.  Else its name matches whats on the server.
     * RETURNS DownloadResponse instance
     * **************************************************************************
     */
    public DownloadResponse getDownloadFileAsInline(String file, String returnName) throws Exception {
        return downloadFile(file, returnName, true);
    }

    private DownloadResponse downloadFile(String file, String returnName, boolean inline) throws Exception {
        File f = fileServiceManager.downloadFile(file, uploadDirectory);
        returnName = (returnName != null && returnName.length() > 0) ? returnName : f.getName();

        // Create our return object and setup its properties
        DownloadResponse downloadResponse = new DownloadResponse();

        // Setup the DownloadResponse
        FileInputStream fis = new FileInputStream(f);
        downloadResponse.setContents(fis);
        downloadResponse.setInline(inline);
        downloadResponse.setFileName(returnName);
        return downloadResponse;
    }
}
