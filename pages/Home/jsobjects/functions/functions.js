export default {
	activeUser: {},
	setActiveUser: (user) => {
		this.activeUser = user;
	},
	getUserFromToken: async () => {
		const token = appsmith.store.token;
		const user = jsonwebtoken.decode(token, 'secret');
		this.setActiveUser(user);
	},
	signOut: async () => {
		clearStore('token', null).then(() => navigateTo('Authentication'));
		showAlert('Logout Success!', 'success');
	},
}