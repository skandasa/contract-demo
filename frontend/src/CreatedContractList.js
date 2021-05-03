import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import {
	Button,
	Backdrop,
	CircularProgress,
	Slide,
	Snackbar,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	Paper,
	TableRow
} from '@material-ui/core';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';

import ContractDetails from './ContractDetails';
import AddContract from './AddContract';
import Pagination from './Pagination';
import DocumentDialogView from './DocumentDialogView';

class CreatedContractList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			contracts: [],
			openContractDetails: false,
			selectedContract: { properties: {} },
			openAddContract: false,
			addNumberOfContracts: 0,
			pageNumber: 0,
			count: -1,
			openDocumentDialogView: false,
			downloadHref: '',
			showBackdrop: false,
			showSnackBar: false,
			snackBarMessage: ''
		};
		this.handleContractAdded = this.handleContractAdded.bind(this);
		this.handleCloseAddContract = this.handleCloseAddContract.bind(this);
		this.handleCloseContractDetails = this.handleCloseContractDetails.bind(this);
		this.handleCloseDocumentDialogView = this.handleCloseDocumentDialogView.bind(this);
		this.handleSnackBarClose = this.handleSnackBarClose.bind(this);
	}

	handleContractAdded() {
		this.setState({ addNumberOfContracts: this.state.addNumberOfContracts + 1 });
		this.setState({ snackBarMessage: 'Contract added successfully' });
		this.setState({ showSnackBar: true });
	}

	handleCloseAddContract() {
		this.setState({ openAddContract: false })
	}

	handleCloseContractDetails() {
		this.setState({ openContractDetails: false })
	}

	handleCloseDocumentDialogView() {
		this.setState({ openDocumentDialogView: false })
	}

	handleSnackBarClose() {
		this.setState({ showSnackBar: false })
	}

	componentDidMount() {
		this.getContracts();
	}

	componentDidUpdate(prevProps, prevState) {
		if (prevState.addNumberOfContracts !== this.state.addNumberOfContracts
			|| prevState.pageNumber !== this.state.pageNumber
			|| prevProps.username !== this.props.username) {
			this.getContracts();
		}
	}

	handlePageNumber = (pageNumber) => {
		this.setState({ pageNumber: pageNumber });
	}

	getContracts() {
		if (this.props.username) {
			this.setState({ showBackdrop: true });
			axios({
				method: 'get',
				url: '/api/cms/instances/file/ot2_app_contract/?include-total=true&sortby=create_time desc&filter=contract_status eq "CREATED"&page='
					+ (this.state.pageNumber + 1),
			}).then(res => {
				this.setState({
					contracts: res.data && res.data._embedded ? res.data._embedded.collection : [],
					count: res.data.total
				});
			}).catch(error => {
				alert(error.response != null && error.response.data != null ? error.response.data : error.message);
			}).finally(() => {
				this.setState({ showBackdrop: false });
			})
		} else {
			this.setState({ contracts: [], count: -1 });
		}
	}

	openDocumentDialogView(downloadHref) {
		this.setState({
			openDocumentDialogView: true,
			downloadHref: downloadHref
		});
	}

	startContractForApproval(contractId) {
		this.setState({ showBackdrop: true });
		console.log(contractId);
		axios({
			method: 'post',
			url: '/api/workflow/createinstance',
			data: {
				"processDefinitionKey": "approveContractId",
				"name": "Sign contract",
				"outcome": "none",
				"variables": [
					{
						"name": "contract_id",
						"value": contractId
					}
				],
				"returnVariables": true
			}
		}).then(() => {
			this.setState({ snackBarMessage: 'Approval requested successfully.' });
			this.setState({ showSnackBar: true });
			this.getContracts();
		}).catch(error => {
			alert(error.response != null && error.response.data != null ? error.response.data : error.message);
		}).finally(() => {
			this.setState({ showBackdrop: false });
		})
	}

	showDetails(contract) {
		this.setState({
			selectedContract: contract,
			openContractDetails: true
		});
	}

	getDateValue(dt) {
		return dt ? new Date(Date.parse(dt)).toLocaleString() : '';
	}

	openContractDialog() {
		this.setState({
			openAddContract: true
		});
	}

	render() {
		return (
			<div>
				<Button variant="contained" color="primary" disabled={!this.props.username} startIcon={<AddIcon />} onClick={() => this.openContractDialog()} style={{ margin: "0.25rem" }}>Add</Button>
				<div className='content-header'>All created contracts</div>
				<TableContainer component={Paper}>
					<Table size="small" aria-label="a dense table">
						<TableHead>
							<TableRow>
								<TableCell>Contract name</TableCell>
								<TableCell align="left">Creation date</TableCell>
								<TableCell align="left">Value</TableCell>
								<TableCell align="left">View document</TableCell>
								<TableCell align="left">Action</TableCell>
								<TableCell align="left" />
							</TableRow>
						</TableHead>
						<TableBody>
							{this.state.contracts.map((row) => (
								<TableRow key={row.id}>
									<TableCell component="th" scope="row">
										{row.name}
									</TableCell>
									<TableCell align="left">{this.getDateValue(row.create_time)}</TableCell>
									<TableCell align="left">{row.properties.contract_value}</TableCell>
									<TableCell align="left">
										<Button size="small" variant="outlined" color="primary" onClick={() => { this.openDocumentDialogView(row._links['urn:eim:linkrel:download-media'].href) }}>Original</Button>
									</TableCell>
									<TableCell align="left">
										<Button size="small" variant="outlined" color="primary" onClick={() => { this.startContractForApproval(row.id) }}>Request approval</Button>
									</TableCell>
									<TableCell align="left">
										<IconButton size="small" variant="outlined" color="primary" title="Show details" onClick={() => { this.showDetails(row) }}>
											<ArrowForwardIosIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
				<Pagination pageNumber={this.state.pageNumber} count={this.state.count} handlePageNumber={this.handlePageNumber} />
				<ContractDetails open={this.state.openContractDetails} selectedContract={this.state.selectedContract} onClose={this.handleCloseContractDetails} />
				<AddContract open={this.state.openAddContract} onAddContract={this.handleContractAdded} onClose={this.handleCloseAddContract} />
				<DocumentDialogView open={this.state.openDocumentDialogView} downloadHref={this.state.downloadHref} onClose={this.handleCloseDocumentDialogView} />
				<Backdrop style={{ zIndex: 9999 }} open={this.state.showBackdrop}>
					<CircularProgress color="inherit" />
				</Backdrop>
				<Snackbar
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'center',
					}}
					open={this.state.showSnackBar}
					autoHideDuration={5000}
					onClose={this.handleSnackBarClose}
					message={this.state.snackBarMessage}
					TransitionComponent={Slide}
					action={
						<React.Fragment>
							<IconButton size="small" aria-label="close" color="inherit">
								<CloseIcon fontSize="small" />
							</IconButton>
						</React.Fragment>
					}
				/>
			</div>
		);
	}
}

const mapStateToProps = state => ({
	username: state.username,
})

export default connect(mapStateToProps)(CreatedContractList);
