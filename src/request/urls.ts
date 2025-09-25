function combineAuthorityUrl(url: string) {
  return `${import.meta.env.VITE_BASE_URL}${url}`;
}

function combineUrl(url: string) {
  return `${import.meta.env.VITE_BASE_URL_HOME}${url}`;
}

export const urls = {
  // 登录登出
  authority: {
    login: combineAuthorityUrl("/authority/manage/user/login"),
    logout: combineAuthorityUrl("/authority/manage/user/logout"),
    tokenValidate: combineAuthorityUrl("/authority/token/validate"),
  },

  // 账号（用户）
  account: {
    accountTableList: combineAuthorityUrl("/authority/user/query/approved"),
    roleUserList: combineAuthorityUrl("/authority/manager/role/user/list"),
    accountCreate: combineAuthorityUrl("/authority/user/create"),
    accountDelete: combineAuthorityUrl("/authority/user/delete"),
    accountPasswordReset: combineAuthorityUrl("/authority/user/password/reset"),

    accountPermission: combineAuthorityUrl(
      "/authority/manager/permission/builder/list/task/all"
    ),
    accountPermissionUpdate: combineAuthorityUrl(
      "/authority/manager/permission/user/update"
    ),
    accountRoleUpdate: combineAuthorityUrl(
      "/authority/manager/role/user/update"
    ),

    accountEdit: combineAuthorityUrl("/authority/user/update"),
  },

  // 角色
  role: {
    roleTableList: combineAuthorityUrl("/authority/manager/role/list"), // 分页
    roleList: combineAuthorityUrl("/authority/manager/role/list/all"), // 不分页
    roleAdd: combineAuthorityUrl("/authority/manager/role/add"),
    roleDelete: combineAuthorityUrl("/authority/manager/role/delete"),
    roleUpdate: combineAuthorityUrl("/authority/manager/role/update"),
    rolePermission: combineAuthorityUrl(
      "/authority/manager/permission/builder/list/contract/menu"
    ),
    rolePermissionUpdate: combineAuthorityUrl(
      "/authority/manager/permission/role/update"
    ),
  },

  // 首页
  home: {
    getOutLineInfo: combineUrl("/homepage/get_outline_info"),
    alarm: combineUrl("/homepage/get_alarm_info"),
    getLivenessCountList: combineUrl("/homepage/get_liveness_count_list"),
  },

  // 楼宇资产
  property: {
    propertyList: combineUrl("/propertypage/search_info"),
    addProperty: combineUrl("/propertypage/add_property"),
    getBindPropertyList: combineUrl("/property/get_binding_list"),
    getSensorKindList: combineUrl("/property/get_kind_list"),
    getSensorTypeList: combineUrl("/property/get_type_list"),
    getPropertyDetails: combineUrl("/propertypage/get_property"),
    updateProperty: combineUrl("/propertypage/update_property"),
  },

  // 楼宇管控
  control: {
    getRegulationList: combineUrl("/controlpage/regulation/search_info"),

    getMonitorPropertyList: combineUrl(
      "/controlpage/regulation/get_monitor_property_list"
    ),
    getControlPropertyList: combineUrl(
      "/controlpage/regulation/get_control_property_list"
    ),
    getFieldSelectList: combineUrl("/property/get_param_list"),
    getTriggerSelectList: combineUrl(
      "/controlpage/regulation/get_trigger_list"
    ),

    addRegulation: combineUrl("/controlpage/regulation/add"),
    updateRegulation: combineUrl("/controlpage/regulation/update"),
    getRegulationDetails: combineUrl("/controlpage/regulation/get_regulation"),

    getManualList: combineUrl("/controlpage/manual/search_info"),
    getManualOperateList: combineUrl("/property/get_operate_list"),
    manualOperate: combineUrl("/controlpage/manual/operate"),
  },

  // 实时数据
  realtime: {
    getOutlineInfo: combineUrl("/rtdpage/get_outline_info"),
    getSensorList: combineUrl("/rtdpage/search_info"),
  },

  // 日志
  log: {
    getLogList: combineUrl("/logpage/search_info"),
    getLogTypeList: combineUrl("/logpage/get_type_list"),

    getThresholdRuleList: combineUrl("/controlpage/threshold/search_info"),
    addThresholdRule: combineUrl("/controlpage/threshold/add"),
    updateThresholdRule: combineUrl("/controlpage/threshold/update"),

    getThresholdRuleDetails: combineUrl("/controlpage/threshold/get"),
  },

  virtual: {
    /** ===================== 进入/退出虚拟空间 ===================== */
    enter: combineUrl("/virtual/enter"),
    quit: combineUrl("/virtual/quit"),

    /** ===================== 资产管理 ===================== */
    property: {
      getAssetsByBuilding: combineUrl("/virtual/propertypage/get_property"),
      add: combineUrl("/virtual/propertypage/add_property"),
      setStatus: combineUrl("/virtual/propertypage/set_property_used"),
      update: combineUrl("/virtual/propertypage/update_property"),
      searchInfo: combineUrl("/virtual/propertypage/search_info"),
      getList: combineUrl("/virtual/propertypage/search_info"),
      getBindList: combineUrl("/virtual/property/get_binding_list"),
      getKindList: combineUrl("/virtual/property/get_kind_list"),
      getTypeList: combineUrl("/virtual/property/get_type_list"),
      getDetails: combineUrl("/virtual/propertypage/get_property"),
      getFieldList: combineUrl("/virtual/property/get_param_list"),
    },

    /** ===================== 实时数据 ===================== */
    rtd: {
      getOutlineInfo: combineUrl("/virtual/rtdpage/get_outline_info"),
      getSensorList: combineUrl("/virtual/rtdpage/search_info"),
    },

    /** ===================== 日志管理 ===================== */
    log: {
      getList: combineUrl("/virtual/logpage/search_info"),
      getTypeList: combineUrl("/virtual/logpage/get_type_list"),
    },

    /** ===================== 预警规则 ===================== */
    threshold: {
      add: combineUrl("/virtual/controlpage/threshold/add"),
      update: combineUrl("/virtual/controlpage/threshold/update"),
      getDetails: combineUrl("/virtual/controlpage/threshold/get"),
      getList: combineUrl("/virtual/controlpage/threshold/search_info"),
    },

    /** ===================== 教学空间 ===================== */
    teaching: {
      // 基础管理
      addNew: combineUrl("/virtual/teaching/add_new"),
      deleteTs: combineUrl("/virtual/teaching/delete_ts"),
      searchInfo: combineUrl("/virtual/teaching/search_info"),
      clearCache: combineUrl("/virtual/teaching/delete_cache"),

      // 定时任务
      task: {
        start: combineUrl("/virtual/teaching/start_timed_task"),
        stop: combineUrl("/virtual/teaching/stop_timed_task"),
      },

      // 终端管理
      terminal: {
        getOnlineList: combineUrl("/virtual/teaching/get_terminal_online"),
        setOnline: combineUrl("/virtual/teaching/set_terminal_online"),
      },

      // 传感器数量/状态
      sensor: {
        getCount: combineUrl("/virtual/teaching/get_sensor_count"),
        setCount: combineUrl("/virtual/teaching/set_sensor_count"),
        getStatus: combineUrl("/virtual/teaching/get_sensor_status"),
        setStatus: combineUrl("/virtual/teaching/set_sensor_status"),
        getData: combineUrl("/virtual/teaching/get_sensor_data"),
        getParamList: combineUrl("/virtual/teaching/get_sensor_field"),
        setParamNextValue: combineUrl(
          "/virtual/teaching/set_sensor_field_value"
        ),
      },
    },

    /** ===================== 下载 ===================== */
    download: {
      code: combineUrl("/virtual/teaching/download_code"),
    },
  },
  // 系统设置
  settings: {
    getTaskInterVal: combineUrl("/setpage/get_liveness_task_interval"),
    setTaskInterVal: combineUrl("/setpage/set_liveness_task_interval"),
  },
};
