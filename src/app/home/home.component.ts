/*
 * Copyright (c) 2016 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */
import {Component, OnInit} from "@angular/core";
import { HomeService } from '../home.service';
import { MessageService } from '../message.service';
import { Options } from '../options'
import {TableSchemaAnalysisResult} from "./TableSchemaAnalysisResult";
import {ColumnSchemaChange} from "./ColumnSchemaChange";
import {Observable} from "rxjs/Observable";
import {of} from "rxjs/observable/of";

@Component({
    styleUrls: ['./home.component.scss'],
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

    analysisId: string;
    currentTableName: string = 'Choose DB tables';
    model = new Options(true, false, true, ['view_backupjob', 'view_bkup_server-mapping', 'qwview_clonejobe', 'view_host_config']);
    /*tableNames = ['view_backupjob', 'view_bkup_server-mapping', 'view_clonejob', 'view_host_config'];*/
    tableNames: Observable<String[]>;
    results: string[] = [];
    columnSchemaChanges: ColumnSchemaChange[] = [];
    schemaStatus: string;
    errors: string[] = [];
    isResultsAndErrosAreHidden = true;
    analyzeIsDisabled: Boolean = true;
    gatherDataIsDisabled: Boolean = true;

    ngOnInit() {
        this.columnSchemaChanges = [];
        this.homeService.getTableNames('public').subscribe(r => {
            console.log("Get table names for public schema: " + JSON.stringify(r));
            this.tableNames = of(r.data);
        }, error => {
            this.isResultsAndErrosAreHidden = false;
            console.error("Can't get table names for schema public error occurred: " + JSON.stringify(error.message));
            this.errors.push("Can't get table names for schema public error occurred: " + JSON.stringify(error.message));
        });
    }

    constructor(private messageService: MessageService, private homeService: HomeService) {

    }

    gatherData(): void {
        // run server request
        this.homeService.gatherDataResult(this.currentTableName).subscribe(r => {
            console.log("Gather data result: " + JSON.stringify(r));
            this.results.push('Data has been collected, status ' + r.status + '. AnalysisId: ' + r.analysisId);
            this.analysisId = r.analysisId;
            this.analyzeIsDisabled = false;
            this.isResultsAndErrosAreHidden = false;
            this.errors = [];
        }, error => {
            this.isResultsAndErrosAreHidden = false;
            console.error("Can't gather data result error occurred: " + JSON.stringify(error.message));
            this.errors.push("Can't gather data result error occurred: " + JSON.stringify(error.message));
        });
    }

    analyze(): void {
        this.homeService.performAnalysis(this.analysisId).subscribe(r => {
            console.log("Analysis result: " + JSON.stringify(r));
            if (r.error != null) {
                this.errors.push(r.error)
            } else {
                this.results.push('Table schema analysis has been performed, status ' + r.status + '. AnalysisId: ' + r.analysisId + '.');
                if (r.data.length > 0) {
                    let analysis: TableSchemaAnalysisResult = r.data[0];
                    this.results.push('Schema Update Status: ' + analysis.schemaUpdateStatus);
                    /*this.results.push('Column Schema Changes: ' + JSON.stringify(analysis.columnChanges));*/

                    this.columnSchemaChanges = analysis.columnChanges;
                    this.schemaStatus = analysis.schemaUpdateStatus;
                    this.isResultsAndErrosAreHidden = false;
                } else {
                    this.results.push('No data');
                }
            }
        }, error => {
            this.isResultsAndErrosAreHidden = false;
            console.error("Can't perform table analysis error occured: " + JSON.stringify(error.message));
            this.errors.push("Can't perform table analysis error occured: " + JSON.stringify(error.message));
        });
    }

    selectTable(tableName: string) {
        this.currentTableName = tableName;
        this.gatherDataIsDisabled = false;
    }

    clear(): void {
        this.results.length = 0;
        this.results = [];
        this.errors = [];
        this.columnSchemaChanges = [];

        this.currentTableName = 'Choose DB tables';
        this.analysisId = null;

        this.isResultsAndErrosAreHidden = true;
        this.analyzeIsDisabled = true;
        this.gatherDataIsDisabled = true;
        console.clear();
    }
}
