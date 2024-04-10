export default {
	Logout () {
		logout.run()
		.then(() => {
			Object.keys(appsmith.store)
			.map(key => storeValue(key, undefined))
		})
		.then(navigateTo('Login'))
		
	},
}