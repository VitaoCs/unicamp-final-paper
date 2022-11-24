const Tail = require('tail').Tail
const axios = require('axios')
const POSITION_FILE_PATH = `${process.env.PWD}/apps/ros2_docker_examples/position.txt`
const ROS_OUTPUT_FILE_PATH = `${process.env.PWD}/apps/ros2_docker_examples/output.txt`
const PUSHGATEWAY_INSTANCE = 'http://localhost:9091/metrics'
const GRAFANA_SCRAPE_INTERVAL_POSITION = 100
const GRAFANA_SCRAPE_INTERVAL_OUTPUT = 1000
const METRICS_TO_PUSHGATEWAY = {
	x: {
		job: 'turtlesim',
		instance: 'position',
		metric: 'x_position',
		delay: GRAFANA_SCRAPE_INTERVAL_POSITION
	},
	y: {
		job: 'turtlesim',
		instance: 'position',
		metric: 'y_position',
		delay: GRAFANA_SCRAPE_INTERVAL_POSITION
	},
	theta: {
		job: 'turtlesim',
		instance: 'position',
		metric: 'theta_position',
		delay: GRAFANA_SCRAPE_INTERVAL_POSITION
	},
	linear_velocity: {
		job: 'turtlesim',
		instance: 'position',
		metric: 'linear_velocity',
		delay: GRAFANA_SCRAPE_INTERVAL_POSITION
	},
	angular_velocity: {
		job: 'turtlesim',
		instance: 'position',
		metric: 'angular_velocity',
		delay: GRAFANA_SCRAPE_INTERVAL_POSITION
	},
	start: {
		job: 'turtlesim',
		instance: 'operation',
		metric: 'start',
		delay: GRAFANA_SCRAPE_INTERVAL_OUTPUT
	},
	collision: {
		job: 'turtlesim',
		instance: 'operation',
		metric: 'collision',
		delay: GRAFANA_SCRAPE_INTERVAL_OUTPUT
	}
}
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

const main = async () => {
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

main()
