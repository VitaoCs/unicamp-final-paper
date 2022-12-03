const ngrok = require('ngrok')
const Tail = require('tail').Tail
const axios = require('axios')
const {
	METRICS_TO_PUSHGATEWAY,
    POSITION_FILE_PATH,
    ROS_OUTPUT_FILE_PATH,
    PUSHGATEWAY_INSTANCE
} = require('./lib/constants')
const { loadConfig } = require('./lib/config')
const {
	ngrokToken,
	ngrokBaseAuth
} = loadConfig()

let collisionWasDetected = false

/* 
	Since Grafana has a scrape interval to search the metrics in Prometheus,
	we need to wait this interval to update the metrics values
*/
const sendToWithDelay = async ({
	job,
	instance,
	data,
	delay
}) => {
	return new Promise((resolve, reject) => {
		setTimeout(async () => {
			try {
				await axios({
					method: 'post',
					url: `${PUSHGATEWAY_INSTANCE}/job/${job}/instance/${instance}`,
					data,
				})
			} catch (error) {
				console.error('Erros with axios request.')
			}
			resolve()
		}, delay);
	})
}

const sendToPushgateway = async ({
	identifier,
	value,
}) => {
	const {
		job,
		instance,
		metric,
		delay
	} = METRICS_TO_PUSHGATEWAY[identifier]

	const data = `${metric} ${value}\n`

	await sendToWithDelay({
		job,
		instance,
		data,
		delay
	})
}

const treatPositionLine = async (line) => {
	const [positionIdentifier, value] = line.split(':')
	if (value && METRICS_TO_PUSHGATEWAY[positionIdentifier]) {
		await sendToPushgateway({
			identifier: positionIdentifier,
			value: value.trim(),
		})
	}
}

const treatOperationLine = async (line) => {
	const message = line.split(': ')[1]
	const START_MESSAGE = 'Starting turtlesim'
	const COLLISION_MESSAGE = 'I hit the wall'
	if (message && message.includes(START_MESSAGE)) {
		await sendToPushgateway({
			identifier: 'start',
			value: '1',
		})
		// indicates the beginning of the simulation so we need to shut down this flag after sending it
		await sendToPushgateway({
			identifier: 'start',
			value: '0',
		})
	} else if (message && message.includes(COLLISION_MESSAGE)) {
		collisionWasDetected = true
		await sendToPushgateway({
			identifier: 'collision',
			value: '1',
		})
	} else if (collisionWasDetected) {
		// since it is no longers colliding, we can bring down this flag
		collisionWasDetected = false
		await sendToPushgateway({
			identifier: 'collision',
			value: '0',
		})
	}
}

const createNgrokTunnel = async () => {
	const url = await ngrok.connect({
		authtoken: ngrokToken
	})
	console.log(`The ngrok tunnel url is: ${url}`)
}

const createTailsForROS = async () => {
	const outputTail = new Tail(ROS_OUTPUT_FILE_PATH);
	const positionTail = new Tail(POSITION_FILE_PATH);

	// Reads output file from ROS execution for health checker
	outputTail.on('line', async function (data) {
		await treatOperationLine(data)
	});
	outputTail.on('error', function (error) {
		console.error('[outputOperationStream] Error while reading file: ', error)
	});

	// Reads position file to check ROS screen location
	positionTail.on('line', async function (data) {
		await treatPositionLine(data)
	});
	positionTail.on('error', function (error) {
		console.error('[positionStream] Error while reading file: ', error)
	});

	console.log('Tails created!')
}

const main = async () => {
	createTailsForROS()
	createNgrokTunnel()
}

main()
