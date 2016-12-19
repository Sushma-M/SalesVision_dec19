/*Copyright (c) 2015-2016 wavemaker-com All Rights Reserved.This software is the confidential and proprietary information of wavemaker-com You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the source code license agreement you entered into with wavemaker-com*/

package com.salesvision2_0.myjavaservice1;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//import com.salesvision2_0.myjavaservice1.model.*;
import com.wavemaker.runtime.service.annotations.ExposeToClient;

/**
 * This is a singleton class with all of its public methods exposed to the client via controller.
 * Their return values and parameters will be passed to the client or taken
 * from the client respectively.
 */
@ExposeToClient
public class MyJavaService1 {

    private static final Logger logger=LoggerFactory.getLogger(MyJavaService1.class);

    public String sampleJavaOperation(String name) {
        String result = null;
        try {
            logger.debug("Starting sample operation");
            result = "Hello " + name + "!";
            logger.debug("Returning {}", result);
            return result;
        } catch (Exception e) {
            logger.error("Sample java service operation has failed", e);
            throw e;
        }
    }
}
