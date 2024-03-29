/*Copyright (c) 2015-2016 wavemaker-com All Rights Reserved.This software is the confidential and proprietary information of wavemaker-com You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the source code license agreement you entered into with wavemaker-com*/
package com.salesdb.service;

/*This is a Studio Managed File. DO NOT EDIT THIS FILE. Your changes may be reverted by Studio.*/


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wavemaker.runtime.data.dao.WMGenericDao;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.file.model.Downloadable;

import com.salesdb.Sales;


/**
 * ServiceImpl object for domain model class Sales.
 *
 * @see Sales
 */
@Service("salesdb.SalesService")
public class SalesServiceImpl implements SalesService {

    private static final Logger LOGGER = LoggerFactory.getLogger(SalesServiceImpl.class);


    @Autowired
    @Qualifier("salesdb.SalesDao")
    private WMGenericDao<Sales, Integer> wmGenericDao;

    public void setWMGenericDao(WMGenericDao<Sales, Integer> wmGenericDao) {
        this.wmGenericDao = wmGenericDao;
    }

    @Transactional(value = "salesdbTransactionManager")
    @Override
	public Sales create(Sales salesInstance) {
        LOGGER.debug("Creating a new Sales with information: {}", salesInstance);
        Sales salesInstanceCreated = this.wmGenericDao.create(salesInstance);
        return salesInstanceCreated;
    }

	@Transactional(readOnly = true, value = "salesdbTransactionManager")
	@Override
	public Sales getById(Integer salesId) throws EntityNotFoundException {
        LOGGER.debug("Finding Sales by id: {}", salesId);
        Sales salesInstance = this.wmGenericDao.findById(salesId);
        if (salesInstance == null){
            LOGGER.debug("No Sales found with id: {}", salesId);
            throw new EntityNotFoundException(String.valueOf(salesId));
        }
        return salesInstance;
    }

    @Transactional(readOnly = true, value = "salesdbTransactionManager")
	@Override
	public Sales findById(Integer salesId) {
        LOGGER.debug("Finding Sales by id: {}", salesId);
        return this.wmGenericDao.findById(salesId);
    }


	@Transactional(rollbackFor = EntityNotFoundException.class, value = "salesdbTransactionManager")
	@Override
	public Sales update(Sales salesInstance) throws EntityNotFoundException {
        LOGGER.debug("Updating Sales with information: {}", salesInstance);
        this.wmGenericDao.update(salesInstance);

        Integer salesId = salesInstance.getId();

        return this.wmGenericDao.findById(salesId);
    }

    @Transactional(value = "salesdbTransactionManager")
	@Override
	public Sales delete(Integer salesId) throws EntityNotFoundException {
        LOGGER.debug("Deleting Sales with id: {}", salesId);
        Sales deleted = this.wmGenericDao.findById(salesId);
        if (deleted == null) {
            LOGGER.debug("No Sales found with id: {}", salesId);
            throw new EntityNotFoundException(String.valueOf(salesId));
        }
        this.wmGenericDao.delete(deleted);
        return deleted;
    }

	@Transactional(readOnly = true, value = "salesdbTransactionManager")
	@Override
	public Page<Sales> findAll(QueryFilter[] queryFilters, Pageable pageable) {
        LOGGER.debug("Finding all Sales");
        return this.wmGenericDao.search(queryFilters, pageable);
    }

    @Transactional(readOnly = true, value = "salesdbTransactionManager")
    @Override
    public Page<Sales> findAll(String query, Pageable pageable) {
        LOGGER.debug("Finding all Sales");
        return this.wmGenericDao.searchByQuery(query, pageable);
    }

    @Transactional(readOnly = true, value = "salesdbTransactionManager")
    @Override
    public Downloadable export(ExportType exportType, String query, Pageable pageable) {
        LOGGER.debug("exporting data in the service salesdb for table Sales to {} format", exportType);
        return this.wmGenericDao.export(exportType, query, pageable);
    }

	@Transactional(readOnly = true, value = "salesdbTransactionManager")
	@Override
	public long count(String query) {
        return this.wmGenericDao.count(query);
    }



}

