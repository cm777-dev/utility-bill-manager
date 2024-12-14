from marshmallow import Schema, fields, validate

class OrganizationSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    created_at = fields.DateTime(dump_only=True)

class SiteSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    organization_id = fields.Int(required=True)
    address = fields.Str()

class CostCenterSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    code = fields.Str(required=True)

class AccountSchema(Schema):
    id = fields.Int(dump_only=True)
    number = fields.Str(required=True)
    cost_center_id = fields.Int(required=True)

class VendorSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    code = fields.Str(required=True)

class RateScheduleSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    vendor_id = fields.Int(required=True)
    effective_date = fields.Date(required=True)
    rate_type = fields.Str(required=True)
    rate_details = fields.Dict()

class MeterSchema(Schema):
    id = fields.Int(dump_only=True)
    number = fields.Str(required=True)
    site_id = fields.Int(required=True)
    utility_type = fields.Str(required=True, validate=validate.OneOf(['electricity', 'water', 'gas']))

class LinkedAccountMeterSchema(Schema):
    id = fields.Int(dump_only=True)
    account_id = fields.Int(required=True)
    meter_id = fields.Int(required=True)
    rate_schedule_id = fields.Int()
    start_date = fields.Date(required=True)
    end_date = fields.Date()

class IntervalDataSchema(Schema):
    id = fields.Int(dump_only=True)
    meter_id = fields.Int(required=True)
    timestamp = fields.DateTime(required=True)
    value = fields.Float(required=True)
    unit = fields.Str(required=True)

class BillAuditSchema(Schema):
    id = fields.Int(dump_only=True)
    bill_id = fields.Int(dump_only=True)
    audit_type = fields.Str(required=True)
    status = fields.Str(required=True, validate=validate.OneOf(['passed', 'failed']))
    message = fields.Str()
    created_at = fields.DateTime(dump_only=True)

class BillSchema(Schema):
    id = fields.Int(dump_only=True)
    linked_account_meter_id = fields.Int(required=True)
    bill_date = fields.Date(required=True)
    due_date = fields.Date(required=True)
    amount = fields.Float(required=True)
    status = fields.Str()
    source_type = fields.Str()
    file_path = fields.Str()
    usage_amount = fields.Float()
    created_at = fields.DateTime(dump_only=True)
    audits = fields.Nested(BillAuditSchema, many=True, dump_only=True)

class ExportLogSchema(Schema):
    id = fields.Int(dump_only=True)
    bill_id = fields.Int(required=True)
    export_type = fields.Str(required=True)
    status = fields.Str(required=True)
    file_path = fields.Str()
    created_at = fields.DateTime(dump_only=True)
