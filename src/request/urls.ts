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

	// 首页
	home: {
		onlineUnit: combineUrl("/homepage/online_unit"),
		alarmCount: combineUrl("/homepage/alarm_count"),
		propertyCount: combineUrl("/homepage/property_count"),

		vitality_day: combineUrl("/homepage/vitality_day"),
		vitality_week: combineUrl("/homepage/vitality_week"),
		vitality_month: combineUrl("/homepage/vitality_month"),

		alarm: combineUrl("/homepage/alarm"),
		propertyList: combineUrl("/homepage/property"),
		sensor_kind: combineUrl("/homepage/sensor_kind"),
	},

	// 账号（用户）
	account: {
		accountTableList: combineAuthorityUrl("/authority/user/query/approved"),
		roleUserList: combineAuthorityUrl("/authority/manager/role/user/list"),
		accountPermission: combineAuthorityUrl(
			"/authority/manager/permission/builder/list/task/all",
		),
		accountCreate: combineAuthorityUrl("/authority/user/create"),
		accountRoleUpdate: combineAuthorityUrl(
			"/authority/manager/role/user/update",
		),
		accountDelete: combineAuthorityUrl("/authority/user/delete"),
		accountPasswordReset: combineAuthorityUrl("/authority/user/password/reset"),
	},

	// 角色
	role: {
		roleTableList: combineAuthorityUrl("/authority/manager/role/list"), // 分页
		roleList: combineAuthorityUrl("/authority/manager/role/list/all"), // 不分页
		roleAdd: combineAuthorityUrl("/authority/manager/role/add"),
		roleDelete: combineAuthorityUrl("/authority/manager/role/delete"),
		roleUpdate: combineAuthorityUrl("/authority/manager/role/update"),
		rolePermission: combineAuthorityUrl(
			"/authority/manager/permission/builder/list/contract/menu",
		),
		rolePermissionUpdate: combineAuthorityUrl(
			"/authority/manager/permission/role/update",
		),
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
			"/controlpage/regulation/get_monitor_property_list",
		),
		getControlPropertyList: combineUrl(
			"/controlpage/regulation/get_control_property_list",
		),
		getFieldSelectList: combineUrl("/property/get_param_list"),
		getTriggerSelectList: combineUrl(
			"/controlpage/regulation/get_trigger_list",
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

	// 系统设置
	settings: {
		getTaskInterVal: combineUrl("/setpage/get_liveness_task_interval"),
		setTaskInterVal: combineUrl("/setpage/set_liveness_task_interval"),
	},
};
