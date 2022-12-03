const { PATH_TO_SECRET_KEYS_FILE } = require('./constants')

const requireConfigFile = (module) => {
	delete require.cache[require.resolve(module)]
	return require(module)
}

const loadConfig = () => {
	const {
        NGROK_TOKEN,
        NGROK_BASE_AUTH
    } = requireConfigFile(PATH_TO_SECRET_KEYS_FILE)

	return { 
		ngrokToken: NGROK_TOKEN,
        ngrokBaseAuth: NGROK_BASE_AUTH
	}
}

module.exports = {
	loadConfig
}