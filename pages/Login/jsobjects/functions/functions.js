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

	signUp: async () => {
		try {
			const data = await sign_up.run();
			console.log(data.identities.length === 0); // Check if the array is empty
			if (data.identities.length === 0) {
				showAlert('User already signed up', 'error');
				return;
			}
			console.log(data.identities.length > 0); // Check if the array is not empty
			showAlert('Email confirmation sent', 'success');
		} catch (error) {
			console.error('Error during sign up:', error);
			// Handle the error appropriately (e.g., show an error message)
		}
	},

	defaultTab: 'Sign In',

	continue: async() => {
		if(!appsmith.URL.fullPath.includes('#access_token=')) return;
		return appsmith.URL.fullPath.split('#')[1].split('&').forEach( i => {
			const [key, value] = i.split('=');
			storeValue(key, value )
		})
		navigateTo('Domains');
		
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