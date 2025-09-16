import type { start } from "repl";

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
    // 没做完
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
    // 进入/退出虚拟空间
    enterVirtual: combineUrl("/virtual/enter"),
    quitVirtual: combineUrl("/virtual/quit"),

    teaching: {
      // 教学空间
      // 开始/停止定时任务
      startTimedTask: combineUrl("/virtual/teaching/start_timed_task"),
      stopTimedTask: combineUrl("/virtual/teaching/stop_timed_task"),

      // 删除所有数据缓存
      clearCache: combineUrl("/virtual/teaching/delete_cache"),

      // 查看终端在线情况
      getTerminalOnlineList: combineUrl(
        "/virtual/teaching/get_terminal_online"
      ),
      // 设置终端在线情况
      setTerminalOnline: combineUrl("/virtual/teaching/set_terminal_online"),
      // 设置传感器数量
      setSensorCount: combineUrl("/virtual/teaching/set_sensor_count"),
      // 获取传感器数量
      getSensorCount: combineUrl("/virtual/teaching/get_sensor_count"),
      // 设置传感器状态
      setSensorStatus: combineUrl("/virtual/teaching/set_sensor_status"),
      // 获取传感器状态
      getSensorStatus: combineUrl("/virtual/teaching/get_sensor_status"),
      // 获取最新传感器数据
      getSensorData: combineUrl("/virtual/teaching/get_sensor_data"),
      // 获取参数字段
      getParamList: combineUrl("/virtual/teaching/get_sensor_field"),
      // 设置字段下次生成的值
      setParamNextValue: combineUrl("/virtual/teaching/set_sensor_field_value"),
    },

    download: {
      // 下载源码
      code: combineUrl("/virtual/teaching/download_code"),
    },
  },

  // 系统设置
  settings: {
    getTaskInterVal: combineUrl("/setpage/get_liveness_task_interval"),
    setTaskInterVal: combineUrl("/setpage/set_liveness_task_interval"),
  },
};
