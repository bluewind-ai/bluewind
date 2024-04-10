export default {
	signIn: () => {
		return sign_in.run()
			.then(data => {
			delete data.user;
			Object.keys(data).forEach(i => {
				storeValue(i, data[i]);
			})
		})
			.then(() => navigateTo('Domains'))
	},
	defaultTab: 'Sign In',

	continue: async() => {
		if(!appsmith.URL.fullPath.includes('#access_token=')) return;
		return appsmith.URL.fullPath.split('#')[1].split('&').forEach( i => {
			const [key, value] = i.split('=');
			storeValue(key, value )
		}

																																 )

	},
	setDefaultTab: (newTab) => {
		this.defaultTab = newTab;
	},

	// storeVariables(name, age, city, profession) => {
	// storeValue('access_token', name, true);
	// storeValue('age', age, true);
	// storeValue('city', city, true);
	// storeValue('profession', profession, true);
	// }

}