const PATH_TO_SECRET_KEYS_FILE = '../../keys.json'
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

module.exports = {
    METRICS_TO_PUSHGATEWAY,
    POSITION_FILE_PATH,
    ROS_OUTPUT_FILE_PATH,
    PUSHGATEWAY_INSTANCE,
    PATH_TO_SECRET_KEYS_FILE
}